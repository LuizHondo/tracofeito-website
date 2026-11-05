"use client";
import Link from "next/link";
import { useState } from "react";
import { StudioGate, useLoad } from "../../../components/studio";
import { Badge, Button, useToast } from "../../../components/ui";
import {
	calls,
	errorMessage,
	type Income,
	money,
	type PayoutStatus,
	planLabel,
} from "../../../lib/api";

const date = (iso: string | null) =>
	iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

const payoutCopy: Record<PayoutStatus, string> = {
	none: "Informe seus dados para abrir a conta de recebimento e poder vender.",
	pending:
		"Estamos aguardando a aprovação da sua conta de recebimento. Você já pode montar o curso, mas ainda não consegue vender.",
	enabled: "Recebimentos ativos. As vendas caem direto na sua conta.",
};

function Payout() {
	const { data } = useLoad(calls.payoutStatus, []);
	if (!data) return null;
	return (
		<section
			aria-labelledby="receb"
			className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6"
		>
			<h2 id="receb" className="font-display text-2xl">
				Recebimentos{" "}
				<Badge tone={data.status === "enabled" ? "success" : "neutral"}>
					{
						{ none: "Não iniciado", pending: "Em análise", enabled: "Ativo" }[
							data.status
						]
					}
				</Badge>
			</h2>
			<p className="text-muted">{payoutCopy[data.status]}</p>
			{data.status === "none" && (
				<Link href="/conta/pagamentos" className="text-primary-soft">
					Configurar recebimentos
				</Link>
			)}
		</section>
	);
}

function Totals({ income }: { income: Income }) {
	const items = [
		["Vendas", `${income.salesCount} · ${money(income.salesCents)}`],
		["Recebido (após taxas)", money(income.receivedCents)],
		["Estornos", `${income.refundsCount} · ${money(income.refundsCents)}`],
	];
	return (
		<dl className="grid gap-4 sm:grid-cols-3">
			{items.map(([t, v]) => (
				<div key={t} className="rounded-2xl border border-border bg-card p-5">
					<dt className="text-muted">{t}</dt>
					<dd className="font-display text-2xl">{v}</dd>
				</div>
			))}
		</dl>
	);
}

function IncomeSection() {
	const toast = useToast();
	const { data: courses } = useLoad(calls.myCourses, []);
	const [courseId, setCourseId] = useState("");
	const { data, setData } = useLoad(
		() => calls.income(courseId ? `?courseId=${courseId}` : ""),
		[courseId],
	);
	async function refund(id: string) {
		if (!window.confirm("Estornar esta venda? O acesso do aluno é reduzido."))
			return;
		try {
			await calls.refund(id);
			toast("Estorno solicitado");
			// access and totals change when the payment provider confirms
			setData(await calls.income(courseId ? `?courseId=${courseId}` : ""));
		} catch (err) {
			toast(errorMessage(err));
		}
	}
	return (
		<section aria-labelledby="renda" className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 id="renda" className="font-display text-2xl">
					Vendas e renda
				</h2>
				<select
					aria-label="Filtrar por curso"
					value={courseId}
					onChange={(e) => setCourseId(e.target.value)}
					className="min-h-11 rounded-xl border border-border bg-background px-3"
				>
					<option value="">Todos os cursos</option>
					{courses?.map((c) => (
						<option key={c.id} value={c.id}>
							{c.title}
						</option>
					))}
				</select>
			</div>
			{!data ? (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			) : (
				<>
					<Totals income={data} />
					{data.charges.length === 0 ? (
						<p className="text-muted">Nenhuma venda ainda.</p>
					) : (
						<div className="overflow-x-auto rounded-2xl border border-border">
							<table className="w-full min-w-[640px] text-left">
								<thead className="border-b border-border text-muted">
									<tr>
										{["Data", "Curso", "Valor", "Recebido", "Status", ""].map(
											(h) => (
												<th
													key={h || "a"}
													scope="col"
													className="px-4 py-3 font-medium"
												>
													{h || <span className="sr-only">Ações</span>}
												</th>
											),
										)}
									</tr>
								</thead>
								<tbody>
									{data.charges.map((c) => (
										<tr
											key={c.id}
											className="border-b border-border last:border-0"
										>
											<td className="px-4 py-3">{date(c.paidAt)}</td>
											<td className="px-4 py-3">{c.courseTitle}</td>
											<td className="px-4 py-3 tabular-nums">
												{money(c.amountCents)}
											</td>
											<td className="px-4 py-3 tabular-nums">
												{c.netCents === null ? "—" : money(c.netCents)}
											</td>
											<td className="px-4 py-3">
												{c.status === "refunded" ? (
													<Badge tone="neutral">
														Estornada {date(c.refundedAt)}
													</Badge>
												) : (
													<Badge tone="success">Paga</Badge>
												)}
											</td>
											<td className="px-4 py-3 text-right">
												{c.status === "paid" && (
													<Button variant="ghost" onClick={() => refund(c.id)}>
														Estornar
													</Button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</section>
	);
}

function Subscribers() {
	const { data } = useLoad(() => calls.subscribers(), []);
	return (
		<section aria-labelledby="alunos" className="flex flex-col gap-4">
			<h2 id="alunos" className="font-display text-2xl">
				Alunos
			</h2>
			{!data ? (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			) : data.length === 0 ? (
				<p className="text-muted">Ninguém assinou ainda.</p>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-border">
					<table className="w-full min-w-[640px] text-left">
						<thead className="border-b border-border text-muted">
							<tr>
								{["Aluno", "Curso", "Plano", "Expira", "Progresso"].map((h) => (
									<th key={h} scope="col" className="px-4 py-3 font-medium">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.map((s) => (
								<tr
									key={s.subscriptionId}
									className="border-b border-border last:border-0"
								>
									<td className="px-4 py-3">
										<div className="flex flex-col">
											<strong>{s.user.username}</strong>
											<span className="text-muted">{s.user.email}</span>
										</div>
									</td>
									<td className="px-4 py-3">{s.courseTitle}</td>
									<td className="px-4 py-3">
										{planLabel({ months: s.planMonths })}
									</td>
									<td className="px-4 py-3">
										{s.expiresAt ? date(s.expiresAt) : "Nunca"}
										{s.canceledAt && (
											<span className="text-muted"> · sem renovação</span>
										)}
									</td>
									<td className="px-4 py-3 tabular-nums">{s.percent}%</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}

export default function Panel() {
	return (
		<StudioGate>
			{() => (
				<main className="mx-auto flex max-w-[1100px] flex-col gap-10 px-[clamp(16px,3vw,32px)] py-10 text-sm">
					<h1 className="font-display text-[40px] leading-none">
						Painel de vendas
					</h1>
					<Payout />
					<IncomeSection />
					<Subscribers />
				</main>
			)}
		</StudioGate>
	);
}
