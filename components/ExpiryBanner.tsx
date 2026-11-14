"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { calls, type MySubscription } from "../lib/api";
import { useMe } from "./Me";

const KEY = "expiryBannerDismissed";

/** In-app warning for signed-in users whose access is about to expire or has expired. */
export function ExpiryBanner() {
	const { me } = useMe();
	const [subs, setSubs] = useState<MySubscription[]>([]);
	const [dismissed, setDismissed] = useState<string | null>(null);
	useEffect(() => {
		if (!me) return setSubs([]);
		try {
			setDismissed(localStorage.getItem(KEY));
		} catch {}
		calls
			.mySubscriptions()
			.then((all) => setSubs(all.filter((s) => s.warning)))
			.catch(() => setSubs([]));
	}, [me]);
	if (subs.length === 0) return null;
	const first = subs[0];
	// Dismissal is tied to this subscription + warning stage, so the banner
	// returns if a different course or a later stage ("expired") kicks in.
	const token = `${first.id}:${first.warning}`;
	if (dismissed === token) return null;
	const dismiss = () => {
		try {
			localStorage.setItem(KEY, token);
		} catch {}
		setDismissed(token);
	};
	const expired = first.warning === "expired";
	return (
		<div
			role="status"
			className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/40 bg-warning/10 px-[clamp(16px,3vw,32px)] py-3 text-[15px]"
		>
			<span>
				<strong>
					{expired ? "Seu acesso expirou" : "Seu acesso está para expirar"}
				</strong>{" "}
				em {first.course.title}
				{subs.length > 1 && ` e mais ${subs.length - 1}`}.
			</span>
			<span className="flex items-center gap-4">
				<Link
					href="/conta/assinaturas"
					className="font-semibold text-primary-soft"
				>
					Renovar
				</Link>
				<button
					type="button"
					onClick={dismiss}
					aria-label="Fechar aviso"
					className="text-muted hover:text-foreground"
				>
					✕
				</button>
			</span>
		</div>
	);
}
