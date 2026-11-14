"use client";
import Link from "next/link";
import { useState } from "react";
import {
	calls,
	type Episode,
	type EpisodePage,
	type Participant,
} from "../lib/api";
import { episodeDate } from "../lib/podcast";
import { Button } from "./ui";

/** Names in order: platform creators link to their profile, guests are plain text. Nothing when empty. */
export function Participants({ list }: { list: Participant[] }) {
	if (list.length === 0) return null;
	return (
		<ul aria-label="Participantes" className="flex flex-wrap gap-x-1.5">
			{list.map((p, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: guests have no id and may repeat a name
				<li key={i}>
					{p.username ? (
						<Link
							href={`/criadores/${p.username}`}
							className="text-primary-soft"
						>
							{p.name}
						</Link>
					) : (
						<>
							{p.name}
							{p.role && <span className="text-muted"> ({p.role})</span>}
						</>
					)}
					{i < list.length - 1 && ","}
				</li>
			))}
		</ul>
	);
}

function Card({ e }: { e: Episode }) {
	return (
		<li className="flex flex-col gap-2">
			<Link href={`/podcast/${e.videoId}`} className="flex flex-col gap-3">
				{/* biome-ignore lint/performance/noImgElement: thumbnail host comes from the API */}
				<img
					src={e.thumbnailUrl}
					alt=""
					loading="lazy"
					className="aspect-video w-full rounded-xl border border-border bg-card object-cover"
				/>
				<time dateTime={e.publishedAt} className="text-[13px] text-muted">
					{episodeDate(e.publishedAt)}
				</time>
				<span className="-mt-1.5 text-[17px] leading-snug font-semibold">
					{e.title}
				</span>
			</Link>
			<div className="text-sm text-muted">
				<Participants list={e.participants} />
			</div>
		</li>
	);
}

/** Episode grid seeded by the server; "Carregar mais" appends the next API page while there is one. */
export function Episodes({ initial }: { initial: EpisodePage }) {
	const [items, setItems] = useState(initial.items);
	const [cursor, setCursor] = useState(initial.nextCursor);
	const [busy, setBusy] = useState(false);
	const [failed, setFailed] = useState(false);

	async function more() {
		if (!cursor) return;
		setBusy(true);
		setFailed(false);
		try {
			const page = await calls.episodes(cursor);
			setItems((cur) => {
				const seen = new Set(cur.map((e) => e.videoId));
				return [...cur, ...page.items.filter((e) => !seen.has(e.videoId))];
			});
			setCursor(page.nextCursor);
		} catch {
			setFailed(true);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-6">
				{items.map((e) => (
					<Card key={e.videoId} e={e} />
				))}
			</ul>
			{failed && (
				<p role="alert" className="text-destructive-fg">
					Não conseguimos carregar mais episódios. Tente de novo.
				</p>
			)}
			{cursor && (
				<Button
					variant="secondary"
					disabled={busy}
					onClick={more}
					className="self-center"
				>
					{busy ? "Carregando…" : "Carregar mais"}
				</Button>
			)}
		</div>
	);
}
