"use client";
import { useState } from "react";
import { useCourse } from "../../../../components/course-ctx";
import { useLoad } from "../../../../components/studio";
import { Badge, Button, Field } from "../../../../components/ui";
import { type Coupon, calls, errorMessage } from "../../../../lib/api";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const status = (c: Coupon) =>
	c.canceledAt ? (
		<Badge tone="neutral">Cancelado</Badge>
	) : new Date(c.expiresAt) < new Date() ? (
		<Badge tone="danger">Expirado</Badge>
	) : (
		<Badge tone="success">Ativo</Badge>
	);

export default function Coupons() {
	const { course } = useCourse();
	const { data: coupons, setData } = useLoad(
		() => calls.coupons(course.id),
		[course.id],
	);
	const [error, setError] = useState("");

	async function add(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = e.currentTarget;
		const v = Object.fromEntries(new FormData(form)) as Record<string, string>;
		setError("");
		try {
			const created = await calls.createCoupon(course.id, {
				code: v.code,
				value: v.value,
				expiresAt: new Date(`${v.expiresAt}T23:59:59`).toISOString(),
			});
			setData([created, ...(coupons ?? [])]);
			form.reset();
		} catch (err) {
			setError(errorMessage(err));
		}
	}
	async function cancel(c: Coupon) {
		await calls.cancelCoupon(course.id, c.id);
		setData(
			(coupons ?? []).map((x) =>
				x.id === c.id ? { ...x, canceledAt: new Date().toISOString() } : x,
			),
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<ul className="flex flex-col gap-3">
				{coupons?.map((c) => (
					<li
						key={c.id}
						className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
					>
						<span className="flex items-center gap-3">
							<code className="rounded-lg border border-dashed border-silver/60 px-2.5 py-1 font-mono">
								{c.code}
							</code>
							<span>
								{c.type === "percent"
									? `${Number(c.value)}%`
									: `R$ ${Number(c.value).toFixed(2).replace(".", ",")}`}
							</span>
							<span className="text-muted">até {fmt(c.expiresAt)}</span>
							{status(c)}
						</span>
						{!c.canceledAt && (
							<Button
								variant="danger"
								onClick={() => cancel(c)}
								aria-label={`Cancelar cupom ${c.code}`}
							>
								Cancelar
							</Button>
						)}
					</li>
				))}
				{coupons?.length === 0 && (
					<li className="text-muted">Nenhum cupom ainda.</li>
				)}
			</ul>
			<form
				onSubmit={add}
				className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-5"
			>
				<h2 className="font-display text-2xl font-bold">Novo cupom</h2>
				<Field name="code" label="Código" required maxLength={40} />
				<Field
					name="value"
					label="Desconto"
					required
					hint="Use 30% para porcentagem ou 30 para reais."
				/>
				<Field name="expiresAt" type="date" label="Vale até" required />
				{error && (
					<p role="alert" className="text-destructive-fg">
						{error}
					</p>
				)}
				<Button type="submit" className="self-start">
					Criar cupom
				</Button>
			</form>
		</div>
	);
}
