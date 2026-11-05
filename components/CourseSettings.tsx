"use client";
import { useState } from "react";
import {
	type Course,
	calls,
	errorMessage,
	money,
	type PaymentType,
} from "../lib/api";
import { parseReais } from "../lib/studio";
import { Button, Field, useToast } from "./ui";

/** Create (no `course`) or edit a course's title, description, cover, base price, payment type and published state. */
export function CourseSettings({
	course,
	onSaved,
}: {
	course?: Course;
	onSaved: (c: Course) => void;
}) {
	const toast = useToast();
	const [priceError, setPriceError] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [paymentType, setPaymentType] = useState<PaymentType>(
		course?.paymentType ?? "subscription",
	);

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
			string,
			string
		>;
		const cents = parseReais(v.price ?? "");
		setPriceError(
			cents === null ? "Informe um valor em reais, como 49,90." : "",
		);
		if (cents === null) return;
		setBusy(true);
		setError("");
		const body = {
			title: v.title,
			description: v.description,
			coverUrl: v.coverUrl?.trim() || null,
			baseMonthlyCents: cents,
			paymentType: v.paymentType as PaymentType,
			...(course && { published: v.published === "on" }),
		};
		try {
			const saved = course
				? await calls.updateCourse(course.id, body)
				: await calls.createCourse(body);
			if (course) toast("Alterações salvas");
			onSaved(saved);
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
			<Field
				name="title"
				label="Título"
				defaultValue={course?.title}
				required
				maxLength={200}
			/>
			<Field
				as="textarea"
				name="description"
				label="Descrição"
				defaultValue={course?.description}
				rows={4}
				maxLength={5000}
			/>
			<Field
				name="coverUrl"
				type="url"
				label="Endereço da capa (opcional)"
				defaultValue={course?.coverUrl ?? ""}
				hint="Imagem 16:9. Sem capa, mostramos o medalhão."
			/>
			<Field
				name="price"
				label={`Preço base${paymentType === "subscription" ? " por mês" : ""} (R$)`}
				defaultValue={
					course ? money(course.baseMonthlyCents).replace(/^R\$\s?/, "") : ""
				}
				inputMode="decimal"
				error={priceError}
				required
			/>
			<Field
				as="select"
				name="paymentType"
				label="Tipo de pagamento"
				value={paymentType}
				onChange={(e) => setPaymentType(e.target.value as PaymentType)}
				options={[
					{ value: "subscription", label: "Assinatura (cobrança recorrente)" },
					{ value: "one_time", label: "Pagamento único" },
				]}
			/>
			{course && (
				<label className="flex min-h-11 items-center gap-3 text-[15px]">
					<input
						type="checkbox"
						name="published"
						defaultChecked={course.published}
						className="size-5 accent-[var(--primary)]"
					/>
					Publicado (só aparece no catálogo com pelo menos um plano)
				</label>
			)}
			{error && (
				<p role="alert" className="text-sm text-destructive-fg">
					{error}
				</p>
			)}
			<Button type="submit" disabled={busy} className="self-start">
				{course ? "Salvar" : "Criar curso"}
			</Button>
		</form>
	);
}
