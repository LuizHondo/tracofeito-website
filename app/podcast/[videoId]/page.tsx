import Link from "next/link";
import { cache } from "react";
import { Participants } from "../../../components/Episodes";
import { episode, episodeDate, linkify } from "../../../lib/podcast";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ videoId: string }> };

// One API read shared by the title and the page.
const load = cache(episode);

export async function generateMetadata({ params }: Props) {
	const e = await load((await params).videoId);
	return {
		title: e
			? `${e.title} — Podcast — Traço Feito`
			: "Episódio não encontrado — Traço Feito",
	};
}

export default async function EpisodePage({ params }: Props) {
	const e = await load((await params).videoId);
	if (!e)
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Episódio não encontrado
				</h1>
				<p className="mb-6 text-muted">
					Esse episódio não existe ou saiu do ar.
				</p>
				<Link href="/podcast" className="text-primary-soft">
					Voltar ao podcast
				</Link>
			</main>
		);
	return (
		<main className="mx-auto flex max-w-[960px] flex-col gap-7 px-[clamp(16px,4vw,56px)] pt-10 pb-24 text-[17px]">
			<Link
				href="/podcast"
				className="self-start py-2.5 text-[15px] text-muted"
			>
				← Podcast
			</Link>
			<div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${e.videoId}`}
					title={e.title}
					allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
					allowFullScreen
					referrerPolicy="strict-origin-when-cross-origin"
					className="absolute inset-0 h-full w-full border-0"
				/>
			</div>
			<div className="flex flex-col gap-2.5">
				<time dateTime={e.publishedAt} className="text-[15px] text-muted">
					{episodeDate(e.publishedAt)}
				</time>
				<h1 className="font-display text-[clamp(32px,4.5vw,52px)] leading-[1.02]">
					{e.title}
				</h1>
			</div>
			{e.participants.length > 0 && (
				<section
					aria-labelledby="participantes"
					className="flex flex-col gap-1"
				>
					<h2 id="participantes" className="eyebrow text-[12px]">
						Participantes
					</h2>
					<Participants list={e.participants} />
				</section>
			)}
			{e.description && (
				// Third-party text: rendered as text nodes and plain links, never as HTML.
				<p className="max-w-[70ch] break-words whitespace-pre-line text-foreground/85">
					{linkify(e.description).map((part, i) =>
						part.href ? (
							<a
								// biome-ignore lint/suspicious/noArrayIndexKey: static split of one string
								key={i}
								href={part.href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary-soft underline"
							>
								{part.text}
							</a>
						) : (
							part.text
						),
					)}
				</p>
			)}
			<a
				href={`https://www.youtube.com/watch?v=${e.videoId}`}
				target="_blank"
				rel="noopener noreferrer"
				className="self-start py-2.5 text-[15px] font-semibold text-primary-soft"
			>
				Ver no YouTube →
			</a>
		</main>
	);
}
