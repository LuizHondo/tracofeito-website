"use client";
import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";
import { api } from "../../lib/api";

export default function SignUp() {
	return (
		<AuthForm
			title="Criar conta"
			submitLabel="Criar conta"
			doneMessage="Conta criada! Enviamos um email para confirmar seu endereço."
			fields={[
				{ name: "email", label: "Email", type: "email", autoComplete: "email" },
				{
					name: "username",
					label: "Nome de usuário",
					autoComplete: "username",
				},
				{
					name: "password",
					label: "Senha (mín. 8 caracteres)",
					type: "password",
					autoComplete: "new-password",
				},
			]}
			submit={async (v) => {
				await api("/auth/sign-up", "POST", v);
				// sign in right away so the user can resend verification or browse
				await api("/auth/sign-in", "POST", {
					login: v.email,
					password: v.password,
				});
			}}
			footer={<Link href="/sign-in">Já tenho conta</Link>}
		/>
	);
}
