"use client";
import { useEffect, useState } from "react";
import {
	type Course,
	calls,
	errorMessage,
	money,
	type PaymentType,
	type Tag,
} from "../lib/api";
import { parseReais } from "../lib/studio";
import { Button, Field, useToast } from "./ui";

const MAX_TAGS = 3;

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

	// Tags are set on an existing course (PATCH `tagSlugs`); the list is the API's.
	const [tags, setTags] = useState<Tag[]>([]);
	const [picked, setPicked] = useState<string[]>(
		course?.tags?.map((t) => t.slug) ?? [],
	);
	useEffect(() => {
		if (course) calls.tags().then(setTags, () => {});
	}, [course]);
	const full = picked.length >= MAX_TAGS;

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
			...(course && tags.length > 0 && { tagSlugs: picked }),
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
			{course && tags.length > 0 && (
				<fieldset
					aria-describedby="tags-hint"
					className="m-0 flex flex-col gap-1.5 border-0 p-0"
				>
					<legend className="mb-1.5 text-sm font-medium">
						Tags ({picked.length} de {MAX_TAGS})
					</legend>
					<div className="flex flex-wrap gap-x-5">
						{tags.map((t) => {
							const on = picked.includes(t.slug);
							return (
								<label
									key={t.slug}
									className={`flex min-h-11 items-center gap-2.5 text-[15px] ${!on && full ? "text-muted" : ""}`}
								>
									<input
										type="checkbox"
										checked={on}
										disabled={!on && full}
										onChange={() =>
											setPicked(
												on
													? picked.filter((s) => s !== t.slug)
													: [...picked, t.slug],
											)
										}
										className="size-5 accent-[var(--primary)]"
									/>
									{t.name}
								</label>
							);
						})}
					</div>
					<span id="tags-hint" className="text-[13px] text-muted">
						{full
							? `Limite de ${MAX_TAGS} tags atingido. Desmarque uma para trocar.`
							: `Escolha até ${MAX_TAGS} tags para o curso aparecer nos filtros do catálogo.`}
					</span>
				</fieldset>
			)}
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
