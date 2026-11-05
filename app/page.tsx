import Link from "next/link";
import { Episodes } from "../components/Episodes";
import { Badge, Cover } from "../components/ui";
import { type Catalog, type CourseCard, money } from "../lib/api";
import { podcastUrl } from "../lib/podcast";
import { serverApi } from "../lib/server";

export const dynamic = "force-dynamic";

function Featured({ c }: { c: CourseCard }) {
	return (
		<Link
			href={`/cursos/${c.id}`}
			className="relative block overflow-hidden rounded-2xl"
		>
			<Cover
				id={c.id}
				title={c.title}
				coverUrl={c.coverUrl}
				size={168}
				className="rounded-2xl"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.11_0.004_75/0.97)] via-[oklch(0.11_0.004_75/0.6)] via-40% to-transparent to-70%" />
			<Badge tone="featured" className="absolute top-5 left-5">
				Em destaque
			</Badge>
			<div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-end justify-between gap-4 text-[oklch(0.93_0.006_85)] sm:right-7 sm:bottom-6 sm:left-7">
				<div className="min-w-0">
					<span className="font-display block text-[clamp(24px,3vw,36px)] leading-tight">
						{c.title}
					</span>
					<span className="text-[15px] text-[oklch(0.75_0.008_80)]">
						por @{c.creator}
					</span>
				</div>
				<Badge tone="price" className="py-2">
					a partir de {money(c.startingPriceCents)}
				</Badge>
			</div>
		</Link>
	);
}

function Card({ c }: { c: CourseCard }) {
	return (
		<Link href={`/cursos/${c.id}`} className="flex flex-col gap-3.5">
			<Cover
				id={c.id}
				title={c.title}
				coverUrl={c.coverUrl}
				className="rounded-xl"
			/>
			<div className="flex flex-col gap-1">
				<span className="font-display text-xl leading-tight font-bold tracking-tight">
					{c.title}
				</span>
				<span className="text-[15px] text-muted">por @{c.creator}</span>
			</div>
			<Badge tone="price" className="self-start">
				a partir de {money(c.startingPriceCents)}
			</Badge>
		</Link>
	);
}

export default async function Home() {
	const catalog = (await serverApi<Catalog>("/catalog")) ?? {
		featured: [],
		courses: [],
	};
	return (
		<>
			<main className="mx-auto flex max-w-[1320px] flex-col gap-24 px-[clamp(16px,4vw,56px)] pt-14 pb-24 text-[17px]">
				{catalog.featured.length > 0 && (
					<section aria-labelledby="destaque" className="flex flex-col gap-7">
						<div className="flex flex-col gap-2.5">
							<span className="eyebrow">Selecionados pela equipe</span>
							<h1
								id="destaque"
								className="font-display text-[clamp(44px,6vw,80px)] leading-[0.98]"
							>
								Em destaque
							</h1>
						</div>
						<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-6">
							{catalog.featured.map((c) => (
								<Featured key={c.id} c={c} />
							))}
						</div>
					</section>
				)}

				<section aria-labelledby="todos" className="flex flex-col gap-7">
					<div className="flex flex-wrap items-baseline justify-between gap-3">
						<h2
							id="todos"
							className="font-display text-[clamp(36px,4vw,48px)] leading-none"
						>
							Todos os cursos
						</h2>
						{catalog.courses.length > 0 && (
							<span className="text-[15px] text-muted">
								{catalog.courses.length}{" "}
								{catalog.courses.length === 1 ? "curso" : "cursos"}
							</span>
						)}
					</div>
					{catalog.courses.length === 0 ? (
						<p className="rounded-2xl border border-border bg-card p-8 text-muted">
							Ainda não tem curso por aqui. Volte em breve, estamos preparando
							novidades.
						</p>
					) : (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-x-6 gap-y-8">
							{catalog.courses.map((c) => (
								<Card key={c.id} c={c} />
							))}
						</div>
					)}
				</section>

				<section
					id="podcast"
					aria-labelledby="pod"
					className="flex flex-col gap-7 border-t border-border pt-14"
				>
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="flex flex-col gap-2.5">
							<span className="eyebrow">No YouTube</span>
							<h2
								id="pod"
								className="font-display text-[clamp(36px,4vw,48px)] leading-none"
							>
								Do podcast
							</h2>
						</div>
						<a
							href={podcastUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="py-2.5 text-[15px] font-semibold text-primary-soft"
						>
							Ver todos os episódios →
						</a>
					</div>
					<Episodes />
				</section>
			</main>
			<footer className="flex flex-wrap items-center justify-between gap-5 border-t border-border px-[clamp(16px,4vw,56px)] py-10 text-[15px] text-muted">
				<span className="font-display text-lg text-foreground">
					Traço Feito
				</span>
				<nav aria-label="Rodapé" className="flex flex-wrap gap-x-6">
					<a href={podcastUrl} className="py-2.5">
						YouTube
					</a>
					<a href="mailto:suporte@exemplo.com" className="py-2.5">
						suporte@exemplo.com
					</a>
				</nav>
			</footer>
		</>
	);
}
