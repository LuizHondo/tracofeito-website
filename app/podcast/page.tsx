import { Episodes } from "../../components/Episodes";
import { podcastUrl } from "../../lib/podcast";

export const metadata = { title: "Podcast — Traço Feito" };

const hosts = [
	{
		name: "Kassini",
		bio: "Ilustrador e apresentador do Traço Feito. Bio em breve.",
	},
	{
		name: "Samuel",
		bio: "Ilustrador e apresentador do Traço Feito. Bio em breve.",
	},
];

export default function Podcast() {
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
				<Episodes />
			</section>

			<section
				aria-labelledby="hosts"
				className="flex flex-col gap-7 border-t border-border pt-14"
			>
				<h2
					id="hosts"
					className="font-display text-[clamp(36px,4vw,48px)] leading-none"
				>
					Apresentadores
				</h2>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6">
					{hosts.map((h) => (
						<div
							key={h.name}
							className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6"
						>
							<h3 className="font-display text-2xl leading-tight">{h.name}</h3>
							<p className="text-muted">{h.bio}</p>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
