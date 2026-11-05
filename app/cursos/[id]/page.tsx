import Link from "next/link";
import { BlockView } from "../../../components/blocks";
import { Medallion } from "../../../components/ui";
import type { Selling } from "../../../lib/api";
import { serverApi } from "../../../lib/server";
import { PlanPicker } from "./PlanPicker";

export const dynamic = "force-dynamic";

export default async function SalesPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ aviso?: string }>;
}) {
	const { id } = await params;
	const { aviso } = await searchParams;
	const data = /^[0-9a-f-]{36}$/.test(id)
		? await serverApi<Selling>(`/content/${id}/selling`)
		: null;
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
	const { course, blocks, plans } = data;
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
					<div className="flex items-start gap-5 border-t border-border pt-7">
						<span className="font-display flex size-16 flex-none items-center justify-center rounded-full border border-silver/60 bg-card-muted text-xl">
							{course.owner.username.slice(0, 2).toUpperCase()}
						</span>
						<div className="flex flex-col gap-1">
							<span className="eyebrow text-[12px]">Quem ensina</span>
							<span className="text-[19px] font-semibold">
								@{course.owner.username}
							</span>
							{course.owner.bio && (
								<span className="text-base text-muted">{course.owner.bio}</span>
							)}
						</div>
					</div>
				</article>
				{plans.length > 0 && <PlanPicker courseId={course.id} plans={plans} />}
			</main>
		</>
	);
}
