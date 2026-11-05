"use client";
import { planTotalCents } from "../../../../lib/shared/index.ts";
import { useState } from "react";
import { useCourse } from "../../../../components/course-ctx";
import { useLoad } from "../../../../components/studio";
import { Badge, Button, Field } from "../../../../components/ui";
import {
	calls,
	errorMessage,
	money,
	type Plan,
	planLabel,
} from "../../../../lib/api";
import { parseReais } from "../../../../lib/studio";

export default function Plans() {
	const { course } = useCourse();
	const { data: plans, setData } = useLoad(
		() => calls.plans(course.id),
		[course.id],
	);
	const [months, setMonths] = useState("12");
	const [discount, setDiscount] = useState("0");
	const [lifetime, setLifetime] = useState("");
	const [error, setError] = useState("");

	const isLifetime = months === "life";
	const cents = parseReais(lifetime);
	const preview = isLifetime
		? cents
		: planTotalCents(course.baseMonthlyCents, {
				months: Number(months),
				discountPercent: Number(discount) || 0,
				lifetimeCents: null,
			});

	async function add(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		const body = isLifetime
			? { months: null, lifetimeCents: cents }
			: { months: Number(months), discountPercent: Number(discount) || 0 };
		try {
			const plan = await calls.createPlan(course.id, body);
			setData(
				[...(plans ?? []), plan].sort(
					(a, b) => (a.months ?? 99) - (b.months ?? 99),
				),
			);
		} catch (err) {
			setError(errorMessage(err));
		}
	}
	async function remove(p: Plan) {
		await calls.deletePlan(course.id, p.id);
		setData((plans ?? []).filter((x) => x.id !== p.id));
	}

	return (
		<div className="flex flex-col gap-8">
			<ul className="flex flex-col gap-3">
				{plans?.map((p) => (
					<li
						key={p.id}
						className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
					>
						<span className="flex items-center gap-2 font-semibold">
							{planLabel(p)}
							{p.discountPercent > 0 && (
								<Badge tone="discount">-{p.discountPercent}%</Badge>
							)}
						</span>
						<span className="flex items-center gap-4">
							<span className="tabular-nums">
								{money(planTotalCents(course.baseMonthlyCents, p))}
							</span>
							<Button
								variant="danger"
								onClick={() => remove(p)}
								aria-label={`Excluir plano ${planLabel(p)}`}
							>
								Excluir
							</Button>
						</span>
					</li>
				))}
				{plans?.length === 0 && (
					<li className="text-muted">
						Sem planos ainda. Sem plano, o curso não aparece no catálogo.
					</li>
				)}
			</ul>
			<form
				onSubmit={add}
				className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-5"
			>
				<h2 className="font-display text-2xl font-bold">Novo plano</h2>
				<Field
					as="select"
					label="Duração"
					value={months}
					onChange={(e) => setMonths(e.target.value)}
					options={[
						...Array.from({ length: 12 }, (_, i) => ({
							value: String(i + 1),
							label: i === 0 ? "1 mês" : `${i + 1} meses`,
						})),
						{ value: "life", label: "Vitalício" },
					]}
				/>
				{isLifetime ? (
					<Field
						label="Preço vitalício (R$)"
						value={lifetime}
						onChange={(e) => setLifetime(e.target.value)}
						inputMode="decimal"
						required
					/>
				) : (
					<Field
						label="Desconto (%)"
						type="number"
						min={0}
						max={100}
						value={discount}
						onChange={(e) => setDiscount(e.target.value)}
					/>
				)}
				<p>
					Total: <strong>{preview === null ? "—" : money(preview)}</strong>
				</p>
				{error && (
					<p role="alert" className="text-destructive-fg">
						{error}
					</p>
				)}
				<Button type="submit" className="self-start">
					Adicionar plano
				</Button>
			</form>
		</div>
	);
}
