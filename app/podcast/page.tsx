import { Episodes } from "../../components/Episodes";
import { firstEpisodes, podcastUrl } from "../../lib/podcast";

export const metadata = { title: "Podcast — Traço Feito" };
export const dynamic = "force-dynamic";

export default async function Podcast() {
	const episodes = await firstEpisodes();
	return (
		<main className="mx-auto flex max-w-[1320px] flex-col gap-16 px-[clamp(16px,4vw,56px)] pt-14 pb-24 text-[17px]">
			<section aria-labelledby="podcast" className="flex flex-col gap-7">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="flex flex-col gap-2.5">
						<span className="eyebrow">No YouTube</span>
						<h1
							id="podcast"
							className="font-display text-[clamp(44px,6vw,80px)] leading-[0.98]"
						>
							Podcast
						</h1>
					</div>
					<a
						href={podcastUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="py-2.5 text-[15px] font-semibold text-primary-soft"
					>
						Ver no YouTube →
					</a>
				</div>
				<p className="max-w-[65ch] text-muted">
					Conversas sobre tudo com artistas convidados diferentes a cada
					episódio.
				</p>
				{!episodes ? (
					<p className="rounded-2xl border border-border bg-card p-8 text-muted">
						Não conseguimos carregar os episódios agora. Enquanto isso, dá para
						assistir{" "}
						<a
							href={podcastUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary-soft"
						>
							direto no canal do YouTube
						</a>
						.
					</p>
				) : episodes.items.length === 0 ? (
					<p className="rounded-2xl border border-border bg-card p-8 text-muted">
						Ainda não tem episódio por aqui. Volte em breve, tem conversa boa
						chegando.
					</p>
				) : (
					<Episodes initial={episodes} />
				)}
			</section>
		</main>
	);
}
