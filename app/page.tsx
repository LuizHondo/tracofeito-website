import Link from "next/link";
import { CourseCard } from "../components/CourseCard";
import { Episodes } from "../components/Episodes";
import { Badge, Cover } from "../components/ui";
import {
	type CourseCard as Card,
	type Catalog,
	money,
	type Tag,
} from "../lib/api";
import { firstEpisodes, podcastUrl } from "../lib/podcast";
import { serverApi } from "../lib/server";

export const dynamic = "force-dynamic";

function Featured({ c }: { c: Card }) {
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
					{c.tags && c.tags.length > 0 && (
						<span className="mt-1 block text-[13px] text-[oklch(0.75_0.008_80)]">
							{c.tags.map((t) => t.name).join(" · ")}
						</span>
					)}
				</div>
				<Badge tone="price" className="py-2">
					a partir de {money(c.startingPriceCents)}
				</Badge>
			</div>
		</Link>
	);
}

const chip = (on: boolean) =>
	`squishy min-h-11 rounded-full px-4 text-[15px] font-medium ${on ? "squishy-primary" : "text-muted"}`;

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ tag?: string | string[] }>;
}) {
	const { tag: raw } = await searchParams;
	const tag = typeof raw === "string" && raw ? raw : undefined;
	const [found, filtered, tagList, episodes] = await Promise.all([
		// Featured always comes from the unfiltered catalog so the hero never moves when a tag is picked.
		serverApi<Catalog>("/catalog"),
		tag ? serverApi<Catalog>(`/catalog?tag=${encodeURIComponent(tag)}`) : null,
		// The filter is optional: without tags the catalog just has no chip row.
		serverApi<Tag[]>("/tags").catch(() => null),
		firstEpisodes(),
	]);
	const catalog = {
		featured: found?.featured ?? [],
		courses: (filtered ?? found)?.courses ?? [],
	};
	const tags = tagList ?? [];
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
					<h2
						id="todos"
						className="font-display text-[clamp(36px,4vw,48px)] leading-none"
					>
						Todos os cursos
					</h2>
					{tags.length > 0 && (
						<nav aria-label="Filtrar por tag" className="flex flex-wrap gap-2">
							<Link
								href="/"
								scroll={false}
								aria-current={tag ? undefined : "true"}
								className={chip(!tag)}
							>
								Todos
							</Link>
							{tags.map((t) => (
								<Link
									key={t.slug}
									href={`/?tag=${encodeURIComponent(t.slug)}`}
									scroll={false}
									aria-current={t.slug === tag ? "true" : undefined}
									className={chip(t.slug === tag)}
								>
									{t.name}
								</Link>
							))}
						</nav>
					)}
					{catalog.courses.length === 0 ? (
						<p className="rounded-2xl border border-border bg-card p-8 text-muted">
							{tag ? (
								<>
									Ainda não tem curso com essa tag.{" "}
									<Link href="/" scroll={false} className="text-primary-soft">
										Limpar filtro
									</Link>
								</>
							) : (
								"Ainda não tem curso por aqui. Volte em breve, estamos preparando novidades."
							)}
						</p>
					) : (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-x-6 gap-y-8">
							{catalog.courses.map((c) => (
								<CourseCard key={c.id} c={c} />
							))}
						</div>
					)}
				</section>

				{episodes && episodes.items.length > 0 && (
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
							<Link
								href="/podcast"
								className="py-2.5 text-[15px] font-semibold text-primary-soft"
							>
								Ver todos os episódios →
							</Link>
						</div>
						<Episodes
							initial={{ items: episodes.items.slice(0, 4), nextCursor: null }}
						/>
					</section>
				)}
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
