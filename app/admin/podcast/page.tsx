"use client";
import { useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin";
import { useMe } from "../../../components/Me";
import { Button, Field, useToast } from "../../../components/ui";
import {
	type AdminUser,
	calls,
	type Episode,
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
	const [guest, setGuest] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!q.trim()) return setFound([]);
		const t = setTimeout(
			() => calls.adminUsers(q.trim(), "").then(setFound, () => setFound([])),
			300,
		);
		return () => clearTimeout(t);
	}, [q]);

	// Only creators and admins can be linked, and each only once.
	const options = found.filter(
		(u) => u.role !== "user" && !list.some((p) => p.userId === u.id),
	);

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
				list.map((p) => (p.userId ? { userId: p.userId } : { name: p.name })),
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
									{p.userId ? "criador" : "convidado"}
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
			<div className="grid gap-5 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Field
						type="search"
						label="Adicionar criador da plataforma"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Buscar por usuário"
					/>
					{q.trim() && options.length === 0 && (
						<span className="text-[13px] text-muted">
							Nenhum criador encontrado.
						</span>
					)}
					{options.map((u) => (
						<Button
							key={u.id}
							variant="secondary"
							className="justify-start"
							onClick={() => {
								setList([
									...list,
									{ userId: u.id, username: u.username, name: u.username },
								]);
								setQ("");
							}}
						>
							Adicionar @{u.username}
						</Button>
					))}
				</div>
				<form
					className="flex flex-col gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						if (!guest.trim()) return;
						setList([...list, { name: guest.trim() }]);
						setGuest("");
					}}
				>
					<Field
						label="Adicionar convidado pelo nome"
						value={guest}
						onChange={(e) => setGuest(e.target.value)}
						maxLength={120}
					/>
					<Button
						type="submit"
						variant="secondary"
						disabled={!guest.trim()}
						className="self-start"
					>
						Adicionar convidado
					</Button>
				</form>
			</div>
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

function Podcast() {
	const [items, setItems] = useState<Episode[] | null>(null);
	const [cursor, setCursor] = useState<string | null>(null);
	const [open, setOpen] = useState<string | null>(null);
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
								<Button
									variant="secondary"
									aria-expanded={open === e.videoId}
									aria-label={`Editar participantes de ${e.title}`}
									onClick={() => setOpen(open === e.videoId ? null : e.videoId)}
								>
									Participantes
								</Button>
							</div>
							{open === e.videoId && (
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
