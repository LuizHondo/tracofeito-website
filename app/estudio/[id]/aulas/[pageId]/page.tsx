"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BlockEditor } from "../../../../../components/BlockEditor";
import { useCourse } from "../../../../../components/course-ctx";
import { NotFound, useLoad } from "../../../../../components/studio";
import { calls } from "../../../../../lib/api";

export default function LessonEditor() {
	const { course } = useCourse();
	const { pageId } = useParams<{ pageId: string }>();
	const { data: pages } = useLoad(
		() => calls.editorPages(course.id),
		[course.id],
	);
	if (!pages)
		return (
			<p role="status" className="text-muted">
				Carregando…
			</p>
		);
	const page = pages.find((p) => p.id === pageId);
	if (!page) return <NotFound what="aula" />;
	const parent = pages.find((p) => p.id === page.parentId);
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col gap-1">
					<Link href={`/estudio/${course.id}/aulas`} className="text-muted">
						← Aulas{parent ? ` · ${parent.title}` : ""}
					</Link>
					<h1 className="font-display text-[clamp(28px,4vw,40px)] leading-none">
						{page.title}
					</h1>
					<span className="font-mono text-[13px] text-muted">
						slug: {page.slug}
					</span>
				</div>
				<Link
					href={`/aprender/${course.id}/${page.id}`}
					className="inline-flex min-h-11 items-center rounded-xl border border-border px-[18px] font-medium"
				>
					Ver como aluno
				</Link>
			</div>
			<BlockEditor courseId={course.id} pageId={page.id} />
		</div>
	);
}
