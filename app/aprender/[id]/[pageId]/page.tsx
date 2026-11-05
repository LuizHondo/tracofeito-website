"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlockView } from "../../../../components/blocks";
import { useRequireUser } from "../../../../components/Me";
import { Button, ProgressBar, useToast } from "../../../../components/ui";
import {
	ApiError,
	calls,
	type Page,
	type PageContent,
	type Progress,
} from "../../../../lib/api";
import { withDepth } from "../../../../lib/learn";

export default function Lesson() {
	const { id, pageId } = useParams<{ id: string; pageId: string }>();
	const me = useRequireUser();
	const router = useRouter();
	const toast = useToast();
	const [pages, setPages] = useState<Page[]>([]);
	const [content, setContent] = useState<PageContent | null>(null);
	const [progress, setProgress] = useState<Progress | null>(null);
	const [missing, setMissing] = useState(false);
	const [closed, setClosed] = useState<string[]>([]);
	const [menu, setMenu] = useState(false);

	useEffect(() => {
		if (!me) return;
		setContent(null);
		setMissing(false);
		Promise.all([calls.pages(id), calls.page(id, pageId), calls.progress(id)])
			.then(([p, c, pr]) => {
				setPages(p);
				setContent(c);
				setProgress(pr);
			})
			.catch((e) => {
				if (e instanceof ApiError && e.status === 403)
					router.replace(`/cursos/${id}?aviso=plano`);
				else setMissing(true);
			});
	}, [me, id, pageId, router]);

	if (!me) return null;
	if (missing)
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Aula não encontrada
				</h1>
				<Link href={`/cursos/${id}`} className="text-primary-soft">
					Voltar ao curso
				</Link>
			</main>
		);
	if (!content || !progress)
		return (
			<p role="status" className="p-8 text-muted">
				Carregando…
			</p>
		);

	const tree = withDepth(pages);
	const hidden = (p: Page): boolean => {
		const parent = pages.find((x) => x.id === p.parentId);
		return !!parent && (closed.includes(parent.id) || hidden(parent));
	};
	const done = new Set(progress.completedPageIds);
	const isDone = done.has(pageId);
	const parent = pages.find((p) => p.id === content.page.parentId);

	async function toggle() {
		const next = !isDone;
		const before = progress;
		const ids = next
			? [...done, pageId]
			: [...done].filter((x) => x !== pageId);
		setProgress({
			completedPageIds: ids,
			total: progress?.total ?? 0,
			percent: progress?.total
				? Math.round((ids.length / progress.total) * 100)
				: 0,
		});
		if (next) toast("Mandou bem! Aula concluída");
		try {
			setProgress(await calls.setComplete(id, pageId, next));
		} catch {
			setProgress(before);
			toast("Não conseguimos salvar. Tente de novo.");
		}
	}

	const pageName = (pid: string | null) =>
		pages.find((p) => p.id === pid)?.title;
	const nav = "flex min-h-11 items-center gap-2 text-[15px]";

	return (
		<div className="flex flex-wrap items-start text-[17px] leading-[1.6]">
			<div className="w-full border-b border-border p-3 lg:hidden">
				<Button
					variant="secondary"
					aria-expanded={menu}
					onClick={() => setMenu(!menu)}
					className="w-full"
				>
					{menu
						? "Fechar conteúdo"
						: `Conteúdo do curso · ${progress.percent}%`}
				</Button>
			</div>
			<nav
				aria-label="Conteúdo do curso"
				className={`${menu ? "flex" : "hidden"} w-full flex-col gap-[22px] border-border p-5 text-[15px] lg:flex lg:max-w-[360px] lg:flex-[1_1_320px] lg:border-r lg:px-5 lg:pt-7 lg:pb-10`}
			>
				<div className="flex flex-col gap-2.5 px-2">
					<div className="flex items-baseline justify-between">
						<span className="eyebrow text-[12px]">Seu progresso</span>
						<span className="font-semibold tabular-nums">
							{progress.percent}%
						</span>
					</div>
					<ProgressBar value={progress.percent} label="Progresso do curso" />
					<span className="text-sm text-muted">
						{done.size} de {progress.total}{" "}
						{progress.total === 1 ? "aula" : "aulas"}
					</span>
				</div>
				<ul className="flex flex-col gap-0.5">
					{tree
						.filter((p) => !hidden(p))
						.map((p) => {
							const cur = p.id === pageId;
							const open = !closed.includes(p.id);
							return (
								<li
									key={p.id}
									className="flex items-center"
									style={{ paddingLeft: p.depth * 16 }}
								>
									{p.hasChildren ? (
										<button
											type="button"
											aria-expanded={open}
											aria-label={`${open ? "Recolher" : "Expandir"} ${p.title}`}
											onClick={() =>
												setClosed(
													open
														? [...closed, p.id]
														: closed.filter((x) => x !== p.id),
												)
											}
											className="flex size-11 flex-none items-center justify-center"
										>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												aria-hidden="true"
												style={{
													transform: open ? "rotate(90deg)" : undefined,
												}}
											>
												<path
													d="M9 6l6 6-6 6"
													fill="none"
													stroke="var(--muted)"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
									) : null}
									<Link
										href={`/aprender/${id}/${p.id}`}
										aria-current={cur ? "page" : undefined}
										className={`flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] px-2.5 ${cur ? "bg-primary/15 text-primary-soft" : p.hasChildren ? "font-semibold" : ""}`}
									>
										<span
											className={`flex size-[18px] flex-none items-center justify-center rounded-full border ${done.has(p.id) ? "border-success bg-success" : cur ? "border-primary" : "border-muted"}`}
										>
											{done.has(p.id) && (
												<svg
													width="11"
													height="11"
													viewBox="0 0 24 24"
													aria-hidden="true"
												>
													<path
														d="M5 12.5l4.5 4.5L19 7.5"
														fill="none"
														stroke="var(--background)"
														strokeWidth="3.4"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											)}
										</span>
										<span>{p.title}</span>
										{done.has(p.id) && (
											<span className="sr-only">(concluída)</span>
										)}
									</Link>
								</li>
							);
						})}
				</ul>
			</nav>

			<main className="min-w-0 flex-[999_1_560px] px-[clamp(16px,4vw,64px)] pt-10 pb-[72px]">
				<article className="mx-auto flex max-w-[860px] flex-col gap-7">
					<div className="flex flex-col gap-2">
						{parent && (
							<span className="eyebrow text-[12px]">{parent.title}</span>
						)}
						<h1 className="font-display text-[clamp(36px,5vw,52px)] leading-none">
							{content.page.title}
						</h1>
					</div>
					{content.blocks.map((b) => (
						<BlockView key={b.id} block={b} courseId={id} />
					))}
					{content.blocks.length === 0 && (
						<p className="text-muted">Esta aula ainda não tem conteúdo.</p>
					)}

					<div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
						{content.prevId ? (
							<Link href={`/aprender/${id}/${content.prevId}`} className={nav}>
								<span aria-hidden="true">←</span>
								<span className="flex flex-col leading-snug">
									<span className="text-[13px] text-muted">Anterior</span>
									{pageName(content.prevId)}
								</span>
							</Link>
						) : (
							<span />
						)}
						<button
							type="button"
							onClick={toggle}
							aria-pressed={isDone}
							className={`flex min-h-12 items-center gap-2.5 rounded-xl px-[22px] text-[15px] font-semibold ${isDone ? "border border-success/50 bg-success/15 text-success" : "bg-primary text-primary-fg"}`}
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									d="M5 12.5l4.5 4.5L19 7.5"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							{isDone ? "Concluída" : "Marcar como concluída"}
						</button>
						{content.nextId ? (
							<Link
								href={`/aprender/${id}/${content.nextId}`}
								className={`${nav} text-right`}
							>
								<span className="flex flex-col leading-snug">
									<span className="text-[13px] text-muted">Próxima</span>
									{pageName(content.nextId)}
								</span>
								<span aria-hidden="true">→</span>
							</Link>
						) : (
							<span />
						)}
					</div>
				</article>
			</main>
		</div>
	);
}
