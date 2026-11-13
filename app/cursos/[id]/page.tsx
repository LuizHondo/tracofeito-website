import Link from "next/link";
import { Avatar } from "../../../components/Avatar";
import { BlockView } from "../../../components/blocks";
import { TagChips } from "../../../components/CourseCard";
import { Medallion } from "../../../components/ui";
import type { FeedbackList, OutlineItem, Selling } from "../../../lib/api";
import {
	outlineCounts,
	outlineSummary,
	plural,
	withDepth,
} from "../../../lib/learn";
import { serverApi } from "../../../lib/server";
import { PlanPicker } from "./PlanPicker";

export const dynamic = "force-dynamic";

/** Static curriculum: lesson titles only, groups with their lesson count. */
function Outline({ outline }: { outline: OutlineItem[] }) {
	const { leaves, lessons, modules } = outlineCounts(outline);
	return (
		<section aria-labelledby="conteudo" className="flex flex-col gap-4">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2
					id="conteudo"
					className="font-display text-[clamp(28px,4vw,40px)] leading-[1.05]"
				>
					Conteúdo do curso
				</h2>
				<span className="text-[15px] text-muted">
					{outlineSummary(lessons, modules)}
				</span>
			</div>
			<ol className="overflow-hidden rounded-2xl border border-border bg-card">
				{withDepth(outline).map((o) => (
					<li
						key={o.id}
						className={`flex items-baseline justify-between gap-4 border-b border-border py-3.5 pr-5 last:border-0 ${o.hasChildren ? "bg-card-muted font-semibold" : ""}`}
						style={{ paddingLeft: 20 + o.depth * 20 }}
					>
						<span className="min-w-0 break-words">{o.title}</span>
						{o.hasChildren && (
							<span className="flex-none text-sm font-normal text-muted">
								{plural(leaves.get(o.id) ?? 0, "aula", "aulas")}
							</span>
						)}
					</li>
				))}
			</ol>
		</section>
	);
}

function Testimonials({ feedback }: { feedback: FeedbackList }) {
	return (
		<section aria-labelledby="feedback" className="flex flex-col gap-4">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2
					id="feedback"
					className="font-display text-[clamp(28px,4vw,40px)] leading-[1.05]"
				>
					Feedback dos alunos
				</h2>
				<span className="text-[15px] text-muted">
					{plural(feedback.count, "feedback", "feedbacks")}
				</span>
			</div>
			<ul className="flex flex-col gap-4">
				{feedback.items.map((f) => (
					<li
						key={f.id}
						className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
					>
						<p className="whitespace-pre-line break-words">{f.text}</p>
						<span className="text-sm text-muted">
							@{f.author.username} ·{" "}
							<time dateTime={f.createdAt}>
								{new Date(f.createdAt).toLocaleDateString("pt-BR", {
									timeZone: "America/Sao_Paulo",
								})}
							</time>
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}

export default async function SalesPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ aviso?: string }>;
}) {
	const { id } = await params;
	const { aviso } = await searchParams;
	const [data, feedback] = /^[0-9a-f-]{36}$/.test(id)
		? await Promise.all([
				serverApi<Selling>(`/content/${id}/selling`),
				// Social proof is optional: the page still sells without it.
				serverApi<FeedbackList>(`/content/${id}/feedback`).catch(() => null),
			])
		: [null, null];
	if (!data)
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Curso não encontrado
				</h1>
				<p className="mb-6 text-muted">
					Esse curso não existe ou ainda não foi publicado.
				</p>
				<Link href="/" className="text-primary-soft">
					Ver todos os cursos
				</Link>
			</main>
		);
	const { course, blocks, plans, outline = [] } = data;
	return (
		<>
			<section className="cover-bg relative flex min-h-[420px] items-end overflow-hidden border-b border-border sm:min-h-[520px]">
				<div className="absolute top-12 right-[clamp(16px,8vw,140px)] hidden sm:block">
					<Medallion id={course.id} title={course.title} size={300} />
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 via-40% to-transparent" />
				<div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-[18px] px-[clamp(16px,4vw,56px)] pb-14">
					<span className="eyebrow">Curso · por @{course.owner.username}</span>
					<h1 className="font-display max-w-[900px] text-[clamp(44px,6.4vw,88px)] leading-[0.95]">
						{course.title}
					</h1>
					{course.description && (
						<p className="max-w-[640px] text-[19px] text-foreground/80">
							{course.description}
						</p>
					)}
					<TagChips tags={course.tags} />
				</div>
			</section>
			{aviso === "plano" && (
				<p
					role="status"
					className="border-b border-border bg-primary/10 px-[clamp(16px,4vw,56px)] py-3 text-[15px]"
				>
					Você precisa de um plano para ver as aulas deste curso.
				</p>
			)}
			<main className="mx-auto flex max-w-[1320px] flex-wrap items-start gap-14 px-[clamp(16px,4vw,56px)] pt-14 pb-24 text-[17px]">
				<article className="flex min-w-0 max-w-[760px] flex-[999_1_560px] flex-col gap-7">
					{blocks.map((b) => (
						<BlockView key={b.id} block={b} />
					))}
					{outline.length > 0 && <Outline outline={outline} />}
					<Link
						href={`/criadores/${course.owner.username}`}
						className="flex items-start gap-5 border-t border-border pt-7"
					>
						<Avatar
							username={course.owner.username}
							url={course.owner.avatarUrl}
						/>
						<span className="flex flex-col gap-1">
							<span className="eyebrow text-[12px]">Quem ensina</span>
							<span className="text-[19px] font-semibold">
								@{course.owner.username}
							</span>
							{course.owner.bio && (
								<span className="text-base text-muted">{course.owner.bio}</span>
							)}
						</span>
					</Link>
					{feedback && feedback.items.length > 0 && (
						<Testimonials feedback={feedback} />
					)}
				</article>
				{plans.length > 0 && <PlanPicker courseId={course.id} plans={plans} />}
			</main>
		</>
	);
}
