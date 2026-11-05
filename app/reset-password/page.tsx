"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "../../components/AuthForm";
import { api } from "../../lib/api";

function Form() {
	const token = useSearchParams().get("token") ?? "";
	return (
		<AuthForm
			title="Nova senha"
			submitLabel="Salvar"
			redirectTo="/sign-in"
			fields={[
				{
					name: "password",
					label: "Nova senha",
					type: "password",
					autoComplete: "new-password",
				},
			]}
			submit={(v) => api("/auth/reset-password", "POST", { token, ...v })}
			footer={
				<>
					Opa, esse link expirou?{" "}
					<Link href="/forgot-password">Peça outro aqui</Link>.
				</>
			}
		/>
	);
}
export default function ResetPassword() {
	return (
		<Suspense>
			<Form />
		</Suspense>
	);
}
