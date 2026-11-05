"use client";
import Link from "next/link";
import { useState } from "react";
import { useRequireUser } from "../../../components/Me";
import { useLoad } from "../../../components/studio";
import { Button, Field, useToast } from "../../../components/ui";
import { calls, errorMessage } from "../../../lib/api";

function PayoutForm({ onSaved }: { onSaved: () => void }) {
	const toast = useToast();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
			string,
			string
		>;
		const digits = (x?: string) => (x ?? "").replace(/\D/g, "");
		setBusy(true);
		setError("");
		try {
			await calls.savePayout({
				name: v.name,
				cpfCnpj: digits(v.cpfCnpj),
				mobilePhone: digits(v.phone),
				postalCode: digits(v.postalCode),
				addressNumber: v.addressNumber,
				birthDate: v.birthDate || undefined,
			});
			toast("Dados enviados");
			onSaved();
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
			<p className="text-sm text-muted">
				Pedimos uma vez. Você pode montar cursos enquanto o pagamento é
				aprovado, mas só vende depois.
			</p>
			<Field name="name" label="Nome completo ou razão social" required />
			<Field name="cpfCnpj" label="CPF ou CNPJ" inputMode="numeric" required />
			<Field
				name="birthDate"
				type="date"
				label="Data de nascimento"
				hint="Obrigatória para CPF."
			/>
			<Field name="phone" label="Celular com DDD" inputMode="tel" required />
			<Field name="postalCode" label="CEP" inputMode="numeric" required />
			<Field name="addressNumber" label="Número do endereço" required />
			{error && (
				<p role="alert" className="text-sm text-destructive-fg">
					{error}
				</p>
			)}
			<Button type="submit" disabled={busy} className="self-start">
				Enviar dados
			</Button>
		</form>
	);
}

export default function Payments() {
	const me = useRequireUser();
	const { data, setData } = useLoad(
		() => (me?.role === "user" ? Promise.resolve(null) : calls.payoutStatus()),
		[me?.role],
	);
	if (!me) return null;
	return (
		<main className="mx-auto max-w-lg px-4 py-14">
			<h1 className="font-display mb-3 text-[40px] leading-none">Pagamentos</h1>
			<Link href="/conta" className="mb-8 inline-block text-primary-soft">
				Voltar ao perfil
			</Link>
			{me.role === "user" ? (
				<p className="text-muted">Só criadores recebem pagamentos.</p>
			) : !data ? null : data.status === "none" ? (
				<PayoutForm onSaved={() => setData({ status: "pending" })} />
			) : (
				<p className="text-muted">
					{data.status === "enabled"
						? "Recebimentos ativos. As vendas caem direto na sua conta."
						: "Conta de recebimento em análise. Você já pode montar cursos, mas ainda não consegue vender."}
				</p>
			)}
		</main>
	);
}
