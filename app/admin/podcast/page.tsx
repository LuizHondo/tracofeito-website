"use client";
import { useEffect, useId, useState } from "react";
import { AdminShell } from "../../../components/admin";
import { useMe } from "../../../components/Me";
import { Button, Field, useToast } from "../../../components/ui";
import {
	type AdminUser,
	calls,
	type Episode,
	type EpisodeDetail,
	errorMessage,
	type Participant,
} from "../../../lib/api";
import { episodeDate } from "../../../lib/podcast";

const names = (list: Participant[]) =>
	list.length ? list.map((p) => p.name).join(", ") : "Sem participantes";

/** Edits one episode's ordered participant list and saves it whole. */
function Editor({
	episode,
	onSaved,
	onClose,
}: {
	episode: Episode;
	onSaved: (list: Participant[]) => void;
	onClose: () => void;
}) {
	const toast = useToast();
	const [list, setList] = useState(episode.participants);
	const [q, setQ] = useState("");
	const [found, setFound] = useState<AdminUser[]>([]);
	const [role, setRole] = useState("");
	const listId = useId();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		const term = q.trim();
		if (!term) return setFound([]);
		const t = setTimeout(
			() => calls.adminUsers(term, "").then(setFound, () => setFound([])),
			300,
		);
		return () => clearTimeout(t);
	}, [q]);

	// Only creators and admins can be linked, and each only once.
	const options = found.filter(
		(u) => u.role !== "user" && !list.some((p) => p.userId === u.id),
	);
	// A name that matches a creator's username links the creator; any other text is a guest.
	const creator = options.find(
		(u) => u.username.toLowerCase() === q.trim().toLowerCase(),
	);

	function add(e: React.FormEvent) {
		e.preventDefault();
		const name = q.trim();
		if (!name) return;
		setList([
			...list,
			creator
				? {
						userId: creator.id,
						username: creator.username,
						name: creator.username,
					}
				: { name, ...(role.trim() && { role: role.trim() }) },
		]);
		setQ("");
		setRole("");
	}

	function move(i: number, d: -1 | 1) {
		const next = [...list];
		[next[i], next[i + d]] = [
			next[i + d] as Participant,
			next[i] as Participant,
		];
		setList(next);
	}

	async function save() {
		setBusy(true);
		setError("");
		try {
			await calls.setParticipants(
				episode.videoId,
				list.map((p) =>
					p.userId
						? { userId: p.userId }
						: { name: p.name, ...(p.role && { role: p.role }) },
				),
			);
			onSaved(list);
			toast("Participantes salvos");
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	const icon =
		"flex size-11 items-center justify-center rounded-lg border border-border text-base disabled:opacity-30";
	return (
		<div className="flex flex-col gap-5 border-t border-border bg-card p-4">
			{list.length === 0 ? (
				<p className="text-muted">Nenhum participante neste episódio.</p>
			) : (
				<ol className="flex flex-col gap-2">
					{list.map((p, i) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: guests have no id and may repeat a name
							key={i}
							className="flex items-center gap-2"
						>
							<span className="min-w-0 flex-1 truncate text-[15px]">
								{p.username ? `@${p.username}` : p.name}
								<span className="ml-2 text-[13px] text-muted">
									{p.userId ? "criador" : (p.role ?? "convidado")}
								</span>
							</span>
							<button
								type="button"
								aria-label={`Mover ${p.name} para cima`}
								disabled={i === 0}
								onClick={() => move(i, -1)}
								className={icon}
							>
								↑
							</button>
							<button
								type="button"
								aria-label={`Mover ${p.name} para baixo`}
								disabled={i === list.length - 1}
								onClick={() => move(i, 1)}
								className={icon}
							>
								↓
							</button>
							<button
								type="button"
								aria-label={`Remover ${p.name}`}
								onClick={() => setList(list.filter((_, j) => j !== i))}
								className={icon}
							>
								✕
							</button>
						</li>
					))}
				</ol>
			)}
			<form onSubmit={add} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
				<Field
					label="Nome do participante"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					list={listId}
					maxLength={120}
					autoComplete="off"
					hint={
						creator
							? `Vai linkar o perfil de @${creator.username}.`
							: "Escolha um criador na lista para linkar o perfil, ou digite o nome de um convidado."
					}
				/>
				<datalist id={listId}>
					{options.map((u) => (
						<option
							key={u.id}
							value={u.username}
							label={`@${u.username} · criador`}
						/>
					))}
				</datalist>
				<Field
					label="Cargo ou descrição"
					value={role}
					onChange={(e) => setRole(e.target.value)}
					disabled={!!creator}
					maxLength={60}
					placeholder="Ex.: escritor"
				/>
				<Button
					type="submit"
					variant="secondary"
					disabled={!q.trim()}
					className="mt-[26px] self-start"
				>
					Adicionar
				</Button>
			</form>
			{error && (
				<p role="alert" className="text-destructive-fg">
					{error}
				</p>
			)}
			<div className="flex gap-3">
				<Button disabled={busy} onClick={save}>
					Salvar participantes
				</Button>
				<Button variant="secondary" onClick={onClose}>
					Fechar
				</Button>
			</div>
		</div>
	);
}

/** Edits one episode's title and description (overrides what the YouTube sync imported). */
function EpisodeEditor({
	videoId,
	onSaved,
	onClose,
}: {
	videoId: string;
	onSaved: (title: string) => void;
	onClose: () => void;
}) {
	const toast = useToast();
	const [detail, setDetail] = useState<EpisodeDetail | null>(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		calls.episode(videoId).then(setDetail, (e) => setError(errorMessage(e)));
	}, [videoId]);

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
			string,
			string
		>;
		setBusy(true);
		setError("");
		try {
			const saved = await calls.updateEpisode(videoId, {
				title: (v.title ?? "").trim(),
				description: (v.description ?? "").trim(),
			});
			onSaved(saved.title);
			toast("Episódio salvo");
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-col gap-5 border-t border-border bg-card p-4">
			{!detail && !error && (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			)}
			{detail && (
				<form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
					<Field
						name="title"
						label="Título"
						defaultValue={detail.title}
						required
						maxLength={200}
					/>
					<Field
						as="textarea"
						name="description"
						label="Descrição"
						defaultValue={detail.description}
						rows={6}
						maxLength={5000}
						hint="Links http(s) viram clicáveis na página do episódio."
					/>
					{error && (
						<p role="alert" className="text-destructive-fg">
							{error}
						</p>
					)}
					<div className="flex gap-3">
						<Button type="submit" disabled={busy}>
							Salvar episódio
						</Button>
						<Button variant="secondary" onClick={onClose}>
							Fechar
						</Button>
					</div>
				</form>
			)}
			{!detail && error && (
				<p role="alert" className="text-destructive-fg">
					{error}
				</p>
			)}
		</div>
	);
}

function Podcast() {
	const [items, setItems] = useState<Episode[] | null>(null);
	const [cursor, setCursor] = useState<string | null>(null);
	// Which episode's panel is open, and which one: its episode fields or its participants.
	const [open, setOpen] = useState<{
		id: string;
		panel: "episode" | "participants";
	} | null>(null);
	const toggle = (id: string, panel: "episode" | "participants") =>
		setOpen(open?.id === id && open.panel === panel ? null : { id, panel });
	const [error, setError] = useState("");
	const [result, setResult] = useState("");
	const [busy, setBusy] = useState(false);

	async function load(from?: string) {
		setError("");
		try {
			const page = await calls.episodes(from);
			setItems((cur) => (from && cur ? [...cur, ...page.items] : page.items));
			setCursor(page.nextCursor);
		} catch (err) {
			setError(errorMessage(err));
		}
	}
	// biome-ignore lint/correctness/useExhaustiveDependencies: first page once on mount
	useEffect(() => {
		load();
	}, []);

	async function sync() {
		setBusy(true);
		setError("");
		setResult("");
		try {
			const r = await calls.syncPodcast();
			setResult(
				`Sincronizado: ${r.created} novos, ${r.updated} atualizados, ${r.removed} removidos.`,
			);
			setOpen(null);
			await load();
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			<div className="flex flex-wrap items-center gap-4">
				<Button disabled={busy} onClick={sync}>
					{busy ? "Sincronizando…" : "Sincronizar agora"}
				</Button>
				<span role="status" className="text-muted">
					{result}
				</span>
			</div>
			{error && (
				<p role="alert" className="text-destructive-fg">
					{error}
				</p>
			)}
			{!items && !error && (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			)}
			{items?.length === 0 && (
				<p className="text-muted">
					Nenhum episódio ainda. Use “Sincronizar agora” para importar do
					YouTube.
				</p>
			)}
			{items && items.length > 0 && (
				<ul className="overflow-hidden rounded-2xl border border-border">
					{items.map((e) => (
						<li
							key={e.videoId}
							className="border-b border-border last:border-0"
						>
							<div className="flex flex-wrap items-center justify-between gap-3 p-4">
								<div className="flex min-w-0 flex-col gap-0.5">
									<span className="text-[15px] font-semibold">{e.title}</span>
									<span className="text-muted">
										{episodeDate(e.publishedAt)} · {names(e.participants)}
									</span>
								</div>
								<div className="flex gap-2">
									<Button
										variant="secondary"
										aria-expanded={
											open?.id === e.videoId && open.panel === "episode"
										}
										aria-label={`Editar ${e.title}`}
										onClick={() => toggle(e.videoId, "episode")}
									>
										Editar
									</Button>
									<Button
										variant="secondary"
										aria-expanded={
											open?.id === e.videoId && open.panel === "participants"
										}
										aria-label={`Editar participantes de ${e.title}`}
										onClick={() => toggle(e.videoId, "participants")}
									>
										Participantes
									</Button>
								</div>
							</div>
							{open?.id === e.videoId && open.panel === "episode" && (
								<EpisodeEditor
									videoId={e.videoId}
									onClose={() => setOpen(null)}
									onSaved={(title) =>
										setItems(
											items.map((x) =>
												x.videoId === e.videoId ? { ...x, title } : x,
											),
										)
									}
								/>
							)}
							{open?.id === e.videoId && open.panel === "participants" && (
								<Editor
									episode={e}
									onClose={() => setOpen(null)}
									onSaved={(list) =>
										setItems(
											items.map((x) =>
												x.videoId === e.videoId
													? { ...x, participants: list }
													: x,
											),
										)
									}
								/>
							)}
						</li>
					))}
				</ul>
			)}
			{cursor && (
				<Button
					variant="secondary"
					className="self-center"
					onClick={() => load(cursor)}
				>
					Carregar mais
				</Button>
			)}
		</>
	);
}

export default function AdminPodcast() {
	const { me } = useMe();
	return (
		<AdminShell title="Podcast">
			{me?.role === "admin" && <Podcast />}
		</AdminShell>
	);
}
