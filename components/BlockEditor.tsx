"use client";
import { type BlockType, blockSchema, youtubeId } from "../lib/shared/index.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { ApiError, calls, errorMessage, type Video } from "../lib/api";
import { Markdown } from "./blocks";
import { Button, Field, ProgressBar } from "./ui";

type Config = Record<string, string>;
type Item = {
	key: string;
	id?: string;
	type: BlockType;
	config: Config;
	error?: string;
	busy?: boolean;
};

const labels: Record<BlockType, string> = {
	title: "Título",
	text: "Texto",
	image: "Imagem",
	video: "Vídeo",
	url: "Link",
};
const MAX_TEXT = 20000;

const IconBtn = (p: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		type="button"
		{...p}
		className="flex size-11 items-center justify-center rounded-lg border border-border text-base disabled:opacity-30"
	/>
);

const savedBefore = (list: Item[], idx: number) =>
	list.slice(0, idx).filter((x) => x.id).length;

/** Block list for a lesson (`pageId`) or the course's selling page (`pageId` null). Each block saves on its own. */
export function BlockEditor({
	courseId,
	pageId,
}: {
	courseId: string;
	pageId: string | null;
}) {
	const [items, setItems] = useState<Item[] | null>(null);
	const [selected, setSelected] = useState<string | null>(null);
	const itemsRef = useRef<Item[]>([]);
	itemsRef.current = items ?? [];

	useEffect(() => {
		calls.blocks(courseId, pageId).then((bs) =>
			setItems(
				bs.map((b) => ({
					key: b.id,
					id: b.id,
					type: b.type,
					config: b.config as Config,
				})),
			),
		);
	}, [courseId, pageId]);

	const patch = useCallback(
		(key: string, p: Partial<Item>) =>
			setItems((cur) =>
				(cur ?? []).map((i) => (i.key === key ? { ...i, ...p } : i)),
			),
		[],
	);

	const save = useCallback(
		async (key: string, config?: Config) => {
			const list = itemsRef.current;
			const idx = list.findIndex((i) => i.key === key);
			const item = list[idx];
			if (!item) return;
			const cfg = config ?? item.config;
			if (!blockSchema.safeParse({ type: item.type, config: cfg }).success)
				return patch(key, {
					error: errorMessage(new ApiError(400, "invalid_block")),
				});
			patch(key, { busy: true, error: undefined, config: cfg });
			try {
				const saved = item.id
					? await calls.updateBlock(courseId, pageId, item.id, { config: cfg })
					: await calls.createBlock(courseId, pageId, {
							type: item.type,
							config: cfg,
							position: savedBefore(list, idx),
						});
				patch(key, { id: saved.id, busy: false });
			} catch (e) {
				patch(key, { busy: false, error: errorMessage(e) });
			}
		},
		[courseId, pageId, patch],
	);

	if (!items)
		return (
			<p role="status" className="text-muted">
				Carregando…
			</p>
		);

	function add(type: BlockType) {
		const at = items ? items.findIndex((i) => i.key === selected) : -1;
		const draft: Item = {
			key: crypto.randomUUID(),
			type,
			config: type === "image" ? { alt: "" } : {},
		};
		const next = [...(items ?? [])];
		next.splice(at < 0 ? next.length : at + 1, 0, draft);
		setItems(next);
		setSelected(draft.key);
	}
	function move(i: number, d: -1 | 1) {
		const next = [...(items ?? [])];
		[next[i], next[i + d]] = [next[i + d] as Item, next[i] as Item];
		setItems(next);
		const it = next[i + d];
		if (it?.id)
			calls
				.updateBlock(courseId, pageId, it.id, {
					position: savedBefore(next, i + d),
				})
				.catch((e) => patch(it.key, { error: errorMessage(e) }));
	}
	async function remove(it: Item) {
		if (it.id) await calls.deleteBlock(courseId, pageId, it.id).catch(() => {});
		setItems((cur) => (cur ?? []).filter((x) => x.key !== it.key));
	}

	return (
		<div className="flex flex-col gap-4">
			<ol className="flex flex-col gap-4">
				{items.map((it, i) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: selection is a convenience, every control inside is keyboard reachable
					<li
						key={it.key}
						onClick={() => setSelected(it.key)}
						onFocus={() => setSelected(it.key)}
						className={`rounded-2xl border bg-card ${selected === it.key ? "border-primary/60" : "border-border"}`}
					>
						<div className="flex items-center gap-2 border-b border-border px-3 py-2">
							<span className="flex-1 pl-1 font-semibold">
								{labels[it.type]}
								{!it.id && (
									<span className="ml-2 text-[13px] font-normal text-muted">
										não salvo
									</span>
								)}
							</span>
							<IconBtn
								aria-label="Mover para cima"
								disabled={i === 0}
								onClick={() => move(i, -1)}
							>
								↑
							</IconBtn>
							<IconBtn
								aria-label="Mover para baixo"
								disabled={i === items.length - 1}
								onClick={() => move(i, 1)}
							>
								↓
							</IconBtn>
							<IconBtn aria-label="Excluir bloco" onClick={() => remove(it)}>
								✕
							</IconBtn>
						</div>
						<div className="flex flex-col gap-4 p-4">
							<BlockFields
								item={it}
								courseId={courseId}
								onChange={(config) => patch(it.key, { config })}
								save={(c) => save(it.key, c)}
							/>
							{it.error && (
								<p role="alert" className="text-destructive-fg">
									{it.error}
								</p>
							)}
							{it.type !== "video" && (
								<div className="flex items-center justify-between gap-3">
									{it.type === "text" ? (
										<span id={`${it.key}-count`} className="text-muted">
											{(it.config.markdown ?? "").length} / {MAX_TEXT}
										</span>
									) : (
										<span />
									)}
									<Button disabled={it.busy} onClick={() => save(it.key)}>
										Salvar bloco
									</Button>
								</div>
							)}
						</div>
					</li>
				))}
				{items.length === 0 && (
					<li className="text-muted">
						Nenhum bloco ainda. Adicione o primeiro abaixo.
					</li>
				)}
			</ol>
			<div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-4">
				<span className="text-muted">
					Adicionar bloco abaixo do selecionado
				</span>
				<div className="flex flex-wrap gap-2">
					{(Object.keys(labels) as BlockType[]).map((t) => (
						<Button key={t} variant="secondary" onClick={() => add(t)}>
							+ {labels[t]}
						</Button>
					))}
				</div>
			</div>
		</div>
	);
}

function BlockFields({
	item,
	courseId,
	onChange,
	save,
}: {
	item: Item;
	courseId: string;
	onChange: (c: Config) => void;
	save: (c?: Config) => Promise<void>;
}) {
	const c = item.config;
	const set = (k: string) => (e: { target: { value: string } }) =>
		onChange({ ...c, [k]: e.target.value });
	switch (item.type) {
		case "title":
			return (
				<Field
					label="Texto do título"
					value={c.text ?? ""}
					onChange={set("text")}
					maxLength={200}
				/>
			);
		case "text":
			return (
				<TextFields
					value={c.markdown ?? ""}
					onChange={(v) => onChange({ ...c, markdown: v })}
					id={item.key}
				/>
			);
		case "image":
			return (
				<>
					<Field
						label="Endereço da imagem"
						type="url"
						value={c.url ?? ""}
						onChange={set("url")}
					/>
					<Field
						label="Descrição (alt)"
						value={c.alt ?? ""}
						onChange={set("alt")}
						maxLength={300}
					/>
				</>
			);
		case "url":
			return (
				<>
					<Field
						label="Rótulo"
						value={c.label ?? ""}
						onChange={set("label")}
						maxLength={200}
					/>
					<Field
						label="Endereço do link"
						type="url"
						value={c.url ?? ""}
						onChange={set("url")}
					/>
				</>
			);
		case "video":
			return <VideoFields item={item} courseId={courseId} save={save} />;
	}
}

function TextFields({
	value,
	onChange,
	id,
}: {
	value: string;
	onChange: (v: string) => void;
	id: string;
}) {
	const [tab, setTab] = useState<"edit" | "view">("edit");
	const tabCls = (on: boolean) =>
		`min-h-11 rounded-lg px-4 text-[15px] ${on ? "bg-card-muted font-semibold" : "text-muted"}`;
	return (
		<div className="flex flex-col gap-3">
			<div role="tablist" aria-label="Modo do texto" className="flex gap-1">
				<button
					type="button"
					role="tab"
					aria-selected={tab === "edit"}
					onClick={() => setTab("edit")}
					className={tabCls(tab === "edit")}
				>
					Editar
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === "view"}
					onClick={() => setTab("view")}
					className={tabCls(tab === "view")}
				>
					Visualizar
				</button>
			</div>
			{tab === "edit" ? (
				<Field
					as="textarea"
					label="Texto em Markdown"
					rows={8}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					maxLength={MAX_TEXT}
					aria-describedby={`${id}-count`}
				/>
			) : (
				<div className="min-h-32 rounded-xl border border-border bg-background p-4 text-base">
					<Markdown>{value || "Nada para mostrar ainda."}</Markdown>
				</div>
			)}
		</div>
	);
}

type UpState = { phase: "idle" | "uploading" | "error"; pct: number };

function VideoFields({
	item,
	courseId,
	save,
}: {
	item: Item;
	courseId: string;
	save: (c?: Config) => Promise<void>;
}) {
	const videoId = item.config.videoId;
	const [up, setUp] = useState<UpState>({ phase: "idle", pct: 0 });
	const [status, setStatus] = useState<Video["status"] | null>(null);
	const [fileName, setFileName] = useState("");
	const input = useRef<HTMLInputElement>(null);
	const [link, setLink] = useState("");
	const [linkError, setLinkError] = useState("");
	const lastFile = useRef<File | null>(null);

	// Poll the host status until it settles; uploading itself is tracked by tus progress.
	useEffect(() => {
		if (!videoId || up.phase === "uploading") return;
		let stop = false;
		const tick = () =>
			calls.video(courseId, videoId).then(
				(v) => {
					if (stop) return;
					setStatus(v.status);
					if (v.status === "processing") setTimeout(tick, 4000);
				},
				() => !stop && setStatus("failed"),
			);
		tick();
		return () => {
			stop = true;
		};
	}, [courseId, videoId, up.phase]);

	async function upload(file: File) {
		lastFile.current = file;
		setFileName(file.name);
		setStatus(null);
		setUp({ phase: "uploading", pct: 0 });
		try {
			const { videoId: id, upload: host } = await calls.createVideo(
				courseId,
				file.name,
			);
			await save({ videoId: id }); // block points at the new video right away
			new tus.Upload(file, {
				endpoint: host.url,
				headers: host.headers,
				metadata: { filetype: file.type, title: file.name },
				retryDelays: [0, 3000, 5000, 10000],
				onProgress: (sent, total) =>
					setUp({ phase: "uploading", pct: Math.round((sent / total) * 100) }),
				onSuccess: () => setUp({ phase: "idle", pct: 100 }),
				onError: () => setUp({ phase: "error", pct: 0 }),
			}).start();
		} catch {
			setUp({ phase: "error", pct: 0 });
		}
	}

	async function useYoutube() {
		const id = youtubeId(link);
		if (!id)
			return setLinkError("Cole um link do YouTube, como https://youtu.be/…");
		setLinkError("");
		await save({ youtubeId: id });
		setLink("");
	}

	const failed = up.phase === "error" || status === "failed";
	const [label, hint, tone] =
		up.phase === "uploading"
			? [
					`Enviando ${up.pct}%`,
					"Mantenha a aba aberta até terminar.",
					"text-primary-soft bg-primary/15",
				]
			: failed
				? [
						"Falhou",
						"Não conseguimos enviar ou processar o vídeo. Envie o arquivo de novo.",
						"text-destructive-fg bg-destructive/15",
					]
				: status === "ready"
					? [
							"Pronto",
							"O vídeo já aparece para os alunos.",
							"text-success bg-success/15",
						]
					: videoId
						? [
								"Processando",
								"Pode sair da página, a gente avisa aqui.",
								"text-warning bg-warning/15",
							]
						: [
								"Sem vídeo",
								"Escolha um arquivo de vídeo para enviar.",
								"text-muted bg-card-muted",
							];

	return (
		<div className="flex flex-col gap-3">
			{fileName && (
				<span className="font-mono text-[13px] text-muted">{fileName}</span>
			)}
			<div aria-live="polite" className="flex flex-wrap items-center gap-3">
				<span
					className={`rounded-full px-2.5 py-1 text-[13px] font-medium ${tone}`}
				>
					{label}
				</span>
				<span className="text-muted">{hint}</span>
			</div>
			{up.phase === "uploading" && (
				<ProgressBar value={up.pct} label="Envio do vídeo" />
			)}
			<input
				ref={input}
				type="file"
				accept="video/*"
				hidden
				onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
			/>
			{item.config.youtubeId && (
				<span className="text-muted">
					Vídeo do YouTube: {item.config.youtubeId}
				</span>
			)}
			<div className="flex items-end gap-3">
				<div className="flex-1">
					<Field
						label="Ou use um vídeo do YouTube"
						type="url"
						value={link}
						onChange={(e) => setLink(e.target.value)}
						error={linkError}
						placeholder="https://www.youtube.com/watch?v=…"
					/>
				</div>
				<Button variant="secondary" disabled={!link} onClick={useYoutube}>
					Usar link
				</Button>
			</div>
			<div className="flex gap-3">
				{failed && lastFile.current ? (
					<Button onClick={() => lastFile.current && upload(lastFile.current)}>
						Enviar de novo
					</Button>
				) : (
					<Button
						variant="secondary"
						disabled={up.phase === "uploading"}
						onClick={() => input.current?.click()}
					>
						{videoId ? "Trocar vídeo" : "Escolher vídeo"}
					</Button>
				)}
			</div>
		</div>
	);
}
