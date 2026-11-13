"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useRequireUser } from "./Me";

const tabs = [
	["/admin/usuarios", "Usuários"],
	["/admin/tags", "Tags"],
	["/admin/podcast", "Podcast"],
] as const;

/** Admin page frame: visitors go to sign-in, non-admins get not-found, admins get the nav, title and `children`. */
export function AdminShell({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	const me = useRequireUser();
	const path = usePathname();
	if (!me) return null;
	if (me.role !== "admin")
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Página não encontrada
				</h1>
				<Link href="/" className="text-primary-soft">
					Voltar ao catálogo
				</Link>
			</main>
		);
	return (
		<>
			<nav
				aria-label="Administração"
				className="flex gap-6 overflow-x-auto border-b border-border px-[clamp(16px,3vw,32px)] text-[15px] font-medium"
			>
				{tabs.map(([href, label]) => (
					<Link
						key={href}
						href={href}
						aria-current={path.startsWith(href) ? "page" : undefined}
						className={`border-b-2 py-3.5 whitespace-nowrap ${path.startsWith(href) ? "border-primary" : "border-transparent text-muted"}`}
					>
						{label}
					</Link>
				))}
			</nav>
			<main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-[clamp(16px,3vw,32px)] py-10 text-sm">
				<h1 className="font-display text-[40px] leading-none">{title}</h1>
				{children}
			</main>
		</>
	);
}
