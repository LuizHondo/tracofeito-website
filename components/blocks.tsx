"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ApiError, type Block, calls } from "../lib/api";

/** User content shown to other users: no raw HTML (react-markdown default), external links in a new tab. */
export function Markdown({ children }: { children: string }) {
	return (
		<div className="prose-tf">
			<ReactMarkdown
				components={{
					a: ({ href, children }) => (
						<a href={href} target="_blank" rel="noopener noreferrer">
							{children}
						</a>
					),
				}}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}

const host = (url: string) => {
	try {
		return new URL(url).host;
	} catch {
		return url;
	}
};

const box = "rounded-2xl border border-border bg-card";

function LinkCard({
	url,
	label,
	hint,
}: {
	url: string;
	label: string;
	hint?: string;
}) {
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className={`${box} flex items-center justify-between gap-4 px-5 py-[18px]`}
		>
			<span className="flex min-w-0 flex-col">
				<span className="font-semibold">{label}</span>
				<span className="truncate text-sm text-muted">{hint ?? host(url)}</span>
			</span>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				aria-hidden="true"
				className="flex-none"
			>
				<path
					d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
					fill="none"
					stroke="var(--silver)"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</a>
	);
}

const playFrame =
	"relative flex aspect-video flex-col items-center justify-center gap-3.5 overflow-hidden rounded-2xl border border-border";

function VideoBlock({
	courseId,
	videoId,
}: {
	courseId: string;
	videoId: string;
}) {
	const [state, setState] = useState<
		"loading" | "processing" | "error" | string
	>("loading");
	useEffect(() => {
		calls
			.playback(courseId, videoId)
			.then((r) => setState(r.url))
			.catch((e) =>
				setState(
					e instanceof ApiError && e.status === 404 ? "processing" : "error",
				),
			);
	}, [courseId, videoId]);
	if (state.startsWith("http"))
		return (
			<div className={`${playFrame} bg-black`}>
				<iframe
					src={state}
					title="Vídeo da aula"
					allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="absolute inset-0 h-full w-full border-0"
				/>
			</div>
		);
	return (
		<div className={`${playFrame} bg-card`} role="status">
			<span className="text-[15px] text-muted">
				{state === "loading"
					? "Carregando vídeo…"
					: state === "processing"
						? "Esse vídeo ainda está sendo processado. Volte daqui a pouco."
						: "Não conseguimos carregar o vídeo. Recarregue a página."}
			</span>
		</div>
	);
}

/**
 * One block as students see it. `courseId` is set in the members area (video
 * playback needs access); without it a video shows the "available for students" frame.
 */
export function BlockView({
	block,
	courseId,
}: {
	block: Block;
	courseId?: string;
}) {
	const c = block.config as Record<string, string>;
	switch (block.type) {
		case "title":
			return (
				<h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.05]">
					{c.text}
				</h2>
			);
		case "text":
			return <Markdown>{c.markdown ?? ""}</Markdown>;
		case "image":
			return (
				// biome-ignore lint/performance/noImgElement: creator-supplied external URLs
				<img
					src={c.url}
					alt={c.alt ?? ""}
					className="w-full rounded-2xl border border-border"
				/>
			);
		case "video":
			return courseId && c.youtubeId ? (
				<div className={`${playFrame} bg-black`}>
					<iframe
						src={`https://www.youtube-nocookie.com/embed/${c.youtubeId}`}
						title="Vídeo da aula"
						allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
						allowFullScreen
						referrerPolicy="strict-origin-when-cross-origin"
						className="absolute inset-0 h-full w-full border-0"
					/>
				</div>
			) : courseId && c.videoId ? (
				<VideoBlock courseId={courseId} videoId={c.videoId} />
			) : (
				<div className={`${playFrame} bg-card`}>
					<span className="text-[15px] text-muted">Disponível para alunos</span>
				</div>
			);
		case "url":
			return <LinkCard url={c.url ?? ""} label={c.label ?? ""} />;
	}
}
