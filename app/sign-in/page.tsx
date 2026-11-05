"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "../../components/AuthForm";
import { api } from "../../lib/api";
import { safeNext } from "../../lib/nav";

function Form() {
	const next = safeNext(useSearchParams().get("next"));
	return (
		<AuthForm
			title="Entrar"
			submitLabel="Entrar"
			redirectTo={next}
			fields={[
				{ name: "login", label: "Email ou usuário", autoComplete: "username" },
				{
					name: "password",
					label: "Senha",
					type: "password",
					autoComplete: "current-password",
				},
			]}
			submit={(v) => api("/auth/sign-in", "POST", v)}
			footer={
				<>
					<Link href="/forgot-password">Esqueci a senha</Link>
					{" · "}
					<Link href="/sign-up">Criar conta</Link>
				</>
			}
		/>
	);
}

export default function SignIn() {
	return (
		<Suspense>
			<Form />
		</Suspense>
	);
}
