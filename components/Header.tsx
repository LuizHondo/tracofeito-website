"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useMe } from "./Me";
import { Logo } from "./ui";

const nav = [
	{ href: "/", label: "Nossos cursos" },
	{ href: "/podcast", label: "Podcast" },
	{ href: "/sobre", label: "Sobre nós" },
];

export function Header() {
	const { me, ready, setMe } = useMe();
	const path = usePathname();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const menu = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const close = (e: MouseEvent | KeyboardEvent) => {
			if (
				e instanceof KeyboardEvent
					? e.key === "Escape"
					: !menu.current?.contains(e.target as Node)
			)
				setOpen(false);
		};
		document.addEventListener("mousedown", close);
		document.addEventListener("keydown", close);
		return () => {
			document.removeEventListener("mousedown", close);
			document.removeEventListener("keydown", close);
		};
	}, [open]);

	async function signOut() {
		await api("/auth/sign-out", "POST").catch(() => {});
		setMe(null);
		setOpen(false);
		router.push("/");
	}

	const initials = me?.username.slice(0, 2).toUpperCase();
	const item =
		"flex min-h-11 items-center px-3 text-[15px] hover:bg-card-muted";

	return (
		<header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-border px-[clamp(16px,4vw,56px)] py-4">
			<Link href="/" className="flex items-center gap-3">
				<Logo />
				<span className="font-display text-[22px]">Traço Feito</span>
			</Link>
			<nav
				aria-label="Principal"
				className="flex flex-wrap gap-x-7 text-[15px] font-medium"
			>
				{nav.map((n) => {
					const current =
						n.href === "/"
							? path === "/"
							: path.startsWith(n.href.split("#")[0] ?? "");
					return (
						<Link
							key={n.href}
							href={n.href}
							aria-current={
								current && n.href !== "/#podcast" ? "page" : undefined
							}
							className={`border-b-2 py-2.5 ${current && n.href !== "/#podcast" ? "border-primary" : "border-transparent text-muted"}`}
						>
							{n.label}
						</Link>
					);
				})}
			</nav>
			<div className="relative min-h-11" ref={menu}>
				{!ready ? null : me ? (
					<>
						<button
							type="button"
							aria-label="Menu da conta"
							aria-expanded={open}
							onClick={() => setOpen(!open)}
							className="size-11 rounded-full border border-silver/60 bg-card-muted text-sm font-semibold"
						>
							{initials}
						</button>
						{open && (
							<div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-2xl">
								<p className="truncate px-3 py-2 text-sm text-muted">
									@{me.username}
								</p>
								{(me.role === "creator" || me.role === "admin") && (
									<Link
										href="/estudio"
										className={item}
										onClick={() => setOpen(false)}
									>
										Estúdio
									</Link>
								)}
								{me.role === "admin" && (
									<Link
										href="/admin/usuarios"
										className={item}
										onClick={() => setOpen(false)}
									>
										Admin
									</Link>
								)}
								<Link
									href="/conta/assinaturas"
									className={item}
									onClick={() => setOpen(false)}
								>
									Minhas assinaturas
								</Link>
								<Link
									href="/conta"
									className={item}
									onClick={() => setOpen(false)}
								>
									Editar perfil
								</Link>
								<button
									type="button"
									onClick={signOut}
									className={`${item} w-full text-left`}
								>
									Sair
								</button>
							</div>
						)}
					</>
				) : (
					<Link
						href={`/sign-in${path === "/" || path.startsWith("/sign-") ? "" : `?next=${encodeURIComponent(path)}`}`}
						className="inline-flex min-h-11 items-center rounded-xl border border-border px-[18px] text-[15px] font-medium"
					>
						Entrar
					</Link>
				)}
			</div>
		</header>
	);
}
