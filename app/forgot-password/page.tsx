"use client";
import { AuthForm } from "../../components/AuthForm";
import { api } from "../../lib/api";

export default function ForgotPassword() {
	return (
		<AuthForm
			title="Redefinir senha"
			submitLabel="Enviar link"
			doneMessage="Se a conta existir, enviamos um link para redefinir a senha."
			fields={[{ name: "email", label: "Email", type: "email" }]}
			submit={(v) => api("/auth/forgot-password", "POST", v)}
		/>
	);
}
