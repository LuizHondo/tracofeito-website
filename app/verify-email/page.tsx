"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMe } from "../../components/Me";
import { Button } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";

function Verify() {
	const token = useSearchParams().get("token");
	const { me } = useMe();
	const [state, setState] = useState<"working" | "ok" | string>("working");
	const [resent, setResent] = useState(false);
	useEffect(() => {
		api("/auth/verify-email", "POST", { token })
			.then(() => setState("ok"))
			.catch((e) => setState(errorMessage(e)));
	}, [token]);
	return (
		<main className="mx-auto max-w-sm px-4 py-14">
			<h1 className="font-display mb-8 text-[40px] leading-none">
				Confirmar email
			</h1>
			<p role="status">
				{state === "working"
					? "Confirmando…"
					: state === "ok"
						? "Email confirmado! Pode seguir."
						: state}
			</p>
			<div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
				{state !== "ok" && state !== "working" && me && !resent && (
					<Button
						variant="secondary"
						onClick={() =>
							api("/auth/resend-verification", "POST").then(() =>
								setResent(true),
							)
						}
					>
						Reenviar email
					</Button>
				)}
				{resent && (
					<span role="status">
						Enviamos outro email. Confira sua caixa de entrada.
					</span>
				)}
				<Link href={me ? "/" : "/sign-in"} className="text-primary-soft">
					{me ? "Ir para o início" : "Entrar"}
				</Link>
			</div>
		</main>
	);
}
export default function VerifyEmail() {
	return (
		<Suspense>
			<Verify />
		</Suspense>
	);
}
