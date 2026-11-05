"use client";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { api, type Me } from "../lib/api";
import { useMe, useRequireUser } from "./Me";
import { Button } from "./ui";

/** Studio gate: signed-in creators/admins get `children(me)`; learners get the "Seja criador" guidance. */
export function StudioGate({ children }: { children: (me: Me) => ReactNode }) {
	const me = useRequireUser();
	if (!me) return null;
	if (me.role === "user")
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Seja criador
				</h1>
				<p className="mb-6 text-muted">
					O estúdio é para quem ensina na Traço Feito. Fale com a equipe pelo
					email suporte@exemplo.com para virar criador e publicar seu primeiro
					curso.
				</p>
				<Link href="/" className="text-primary-soft">
					Voltar ao catálogo
				</Link>
			</main>
		);
	return <>{children(me)}</>;
}

export function NotFound({ what = "curso" }: { what?: string }) {
	return (
		<main className="mx-auto max-w-xl px-4 py-24 text-center">
			<h1 className="font-display mb-4 text-[40px] leading-none">
				Não encontramos esse {what}
			</h1>
			<Link href="/estudio" className="text-primary-soft">
				Voltar ao estúdio
			</Link>
		</main>
	);
}

export function VerifyBanner() {
	const { me } = useMe();
	const [sent, setSent] = useState(false);
	if (!me || me.emailVerified) return null;
	return (
		<div
			role="status"
			className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/40 bg-warning/10 px-[clamp(16px,3vw,32px)] py-3 text-[15px]"
		>
			<span>
				<strong>Confirme seu email para criar cursos.</strong> Enviamos um link
				para {me.email}.
			</span>
			{sent ? (
				<span>Enviamos outro email.</span>
			) : (
				<Button
					variant="secondary"
					onClick={() =>
						api("/auth/resend-verification", "POST").then(() => setSent(true))
					}
				>
					Reenviar email
				</Button>
			)}
		</div>
	);
}

/** Runs `load` on mount and exposes its result; `error` is set when it rejects. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<unknown>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the caller's deps decide when to reload
	useEffect(() => {
		load().then(setData, setError);
	}, [...deps]);
	return { data, setData, error };
}
