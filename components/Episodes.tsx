import { episodes, podcastUrl } from "../lib/podcast";

export function Episodes() {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-6">
			{episodes.map((e) => (
				<a
					key={e.id}
					href={podcastUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex flex-col gap-3"
				>
					<div className="relative flex aspect-video items-center justify-center rounded-xl border border-border bg-card">
						<span className="flex size-[52px] items-center justify-center rounded-full border border-silver bg-background/80">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path d="M7 4.5v15l12-7.5z" fill="currentColor" />
							</svg>
						</span>
					</div>
					<span className="text-[13px] text-muted">{e.date}</span>
					<span className="-mt-1.5 text-[17px] leading-snug font-semibold">
						{e.title}
					</span>
				</a>
			))}
		</div>
	);
}
