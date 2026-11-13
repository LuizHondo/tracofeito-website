import Link from "next/link";
import { type CourseCard as Card, money, type Tag } from "../lib/api";
import { Badge, Cover } from "./ui";

/** Tag names as returned by the API; renders nothing without tags. */
export function TagChips({ tags }: { tags?: Tag[] }) {
	if (!tags?.length) return null;
	return (
		<ul aria-label="Tags" className="flex flex-wrap gap-2">
			{tags.map((t) => (
				<li key={t.slug}>
					<Badge tone="neutral">{t.name}</Badge>
				</li>
			))}
		</ul>
	);
}

/** Catalog card: cover, title, creator, tags and starting price, linking to the sales page. */
export function CourseCard({ c }: { c: Card }) {
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
			<TagChips tags={c.tags} />
			<Badge tone="price" className="self-start">
				a partir de {money(c.startingPriceCents)}
			</Badge>
		</Link>
	);
}
