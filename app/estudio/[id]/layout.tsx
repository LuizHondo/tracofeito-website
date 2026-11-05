"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { CourseCtx } from "../../../components/course-ctx";
import {
	NotFound,
	StudioGate,
	useLoad,
	VerifyBanner,
} from "../../../components/studio";
import { type Course, calls } from "../../../lib/api";

const tabs = [
	["configuracoes", "Configurações"],
	["planos", "Planos"],
	["cupons", "Cupons"],
	["vendas", "Página de vendas"],
	["aulas", "Aulas"],
] as const;

function Editor({ children }: { children: ReactNode }) {
	const { id } = useParams<{ id: string }>();
	const path = usePathname();
	const { data, error } = useLoad(() => calls.course(id), [id]);
	const [override, setOverride] = useState<Course | null>(null);
	if (error) return <NotFound />; // API 403/404 both read as not-found
	const course = override ?? data;
	if (!course)
		return (
			<p role="status" className="p-8 text-muted">
				Carregando…
			</p>
		);
	return (
		<CourseCtx.Provider value={{ course, setCourse: setOverride }}>
			<VerifyBanner />
			<div className="flex flex-wrap items-center gap-3 border-b border-border px-[clamp(16px,3vw,32px)] py-3.5 text-[15px]">
				<Link href="/estudio" className="text-muted">
					Estúdio
				</Link>
				<span aria-hidden="true" className="text-muted">
					/
				</span>
				<span className="font-display truncate text-lg font-bold">
					{course.title}
				</span>
			</div>
			<nav
				aria-label="Seções do curso"
				className="flex gap-6 overflow-x-auto border-b border-border px-[clamp(16px,3vw,32px)] text-[15px] font-medium"
			>
				{tabs.map(([slug, label]) => {
					const on = path.startsWith(`/estudio/${id}/${slug}`);
					return (
						<Link
							key={slug}
							href={`/estudio/${id}/${slug}`}
							aria-current={on ? "page" : undefined}
							className={`border-b-2 py-3.5 whitespace-nowrap ${on ? "border-primary" : "border-transparent text-muted"}`}
						>
							{label}
						</Link>
					);
				})}
			</nav>
			<main className="mx-auto max-w-[1100px] px-[clamp(16px,3vw,32px)] py-8 text-sm">
				{children}
			</main>
		</CourseCtx.Provider>
	);
}

export default function EditorLayout({ children }: { children: ReactNode }) {
	return <StudioGate>{() => <Editor>{children}</Editor>}</StudioGate>;
}
