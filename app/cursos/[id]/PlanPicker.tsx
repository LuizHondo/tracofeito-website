"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe } from "../../../components/Me";
import { Badge, Button, Field, LinkButton } from "../../../components/ui";
import {
	ApiError,
	calls,
	errorMessage,
	money,
	type Plan,
	planLabel,
} from "../../../lib/api";
import { defaultPlan, resumePage } from "../../../lib/learn";
import { signInUrl } from "../../../lib/nav";

type Viewer = "loading" | "visitor" | "none" | { lessonId: string | null };

/** Visitor / no access / has access, probed with calls the API already has (no new endpoint). */
function useViewer(courseId: string): Viewer {
	const { me, ready } = useMe();
	const [viewer, setViewer] = useState<Viewer>("loading");
	useEffect(() => {
		if (!ready) return;
		if (!me) return setViewer("visitor");
		calls
			.pages(courseId)
			.then(async (pages) => {
				const progress = await calls.progress(courseId).catch(() => null);
				setViewer({
					lessonId:
						resumePage(pages, progress?.completedPageIds ?? [])?.id ?? null,
				});
			})
			.catch(() => setViewer("none"));
	}, [ready, me, courseId]);
	return viewer;
}

/** Coupon + buyer data, then the provider's payment link (Pix, boleto or card). */
function Checkout({ courseId, planId }: { courseId: string; planId: string }) {
	const [coupon, setCoupon] = useState("");
	const [name, setName] = useState("");
	const [cpfCnpj, setCpfCnpj] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const subscribed =
		error === errorMessage(new ApiError(409, "already_subscribed"));
	return (
		<form
			className="flex flex-col gap-3.5"
			onSubmit={async (e) => {
				e.preventDefault();
				setBusy(true);
				setError("");
				try {
					const { url } = await calls.purchase(courseId, {
						planId,
						couponCode: coupon.trim() || undefined,
						buyer: { name: name.trim(), cpfCnpj: cpfCnpj.replace(/\D/g, "") },
					});
					window.location.assign(url);
				} catch (err) {
					setError(errorMessage(err));
					setBusy(false);
				}
			}}
		>
			<Field
				label="Cupom (opcional)"
				value={coupon}
				onChange={(e) => setCoupon(e.target.value)}
				autoComplete="off"
			/>
			<Field
				label="Nome completo"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
				autoComplete="name"
			/>
			<Field
				label="CPF ou CNPJ"
				value={cpfCnpj}
				onChange={(e) => setCpfCnpj(e.target.value)}
				required
				inputMode="numeric"
				hint="Usado só para emitir a cobrança."
			/>
			<Button type="submit" disabled={busy} className="min-h-[52px]">
				{busy ? "Gerando cobrança…" : "Ir para o pagamento"}
			</Button>
			{error && (
				<p role="alert" className="text-sm text-destructive-fg">
					{error}{" "}
					{subscribed && (
						<Link href="/conta" className="text-primary-soft">
							Minha conta
						</Link>
					)}
				</p>
			)}
			<span className="text-center text-sm text-muted">
				Pix, boleto ou cartão. O valor final com cupom aparece na cobrança.
			</span>
		</form>
	);
}

export function PlanPicker({
	courseId,
	plans,
}: {
	courseId: string;
	plans: Plan[];
}) {
	const [selected, setSelected] = useState(defaultPlan(plans)?.id);
	const viewer = useViewer(courseId);
	const plan = plans.find((p) => p.id === selected);
	return (
		<aside
			aria-labelledby="planos"
			className="flex max-w-[460px] min-w-0 flex-[1_1_380px] flex-col gap-[18px] rounded-2xl border border-border bg-card p-7"
		>
			<h2 id="planos" className="font-display text-[28px]">
				Escolha seu plano
			</h2>
			<fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
				<legend className="sr-only">Planos</legend>
				{plans.map((p) => {
					const on = p.id === selected;
					const total = p.priceCents ?? 0;
					return (
						<label
							key={p.id}
							className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 ${on ? "border-primary bg-primary/10" : "border-border"}`}
						>
							<input
								type="radio"
								name="plano"
								checked={on}
								onChange={() => setSelected(p.id)}
								className="m-0 size-5 accent-[var(--primary)]"
							/>
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="flex items-center gap-2 font-semibold">
									{planLabel(p)}
									{p.discountPercent > 0 && (
										<Badge tone="discount" className="px-2 py-0.5 text-[12px]">
											-{p.discountPercent}%
										</Badge>
									)}
								</span>
								<span className="text-sm text-muted">
									{p.months === null
										? "Pagamento único"
										: `${money(Math.round(total / p.months))}/mês`}
								</span>
							</span>
							<span className="font-semibold whitespace-nowrap tabular-nums">
								{money(total)}
							</span>
						</label>
					);
				})}
			</fieldset>
			{plan && (
				<p className="text-sm text-muted">
					Total:{" "}
					<strong className="text-foreground">
						{money(plan.priceCents ?? 0)}
					</strong>
				</p>
			)}

			{viewer === "loading" && (
				<div
					aria-hidden="true"
					className="h-[52px] animate-pulse rounded-xl bg-card-muted"
				/>
			)}
			{viewer === "visitor" && (
				<>
					<LinkButton
						href={signInUrl(`/cursos/${courseId}`)}
						className="min-h-[52px]"
					>
						Assinar
					</LinkButton>
					<span className="text-center text-sm text-muted">
						Você entra ou cria sua conta antes de assinar.
					</span>
				</>
			)}
			{viewer === "none" && selected && (
				<Checkout courseId={courseId} planId={selected} />
			)}
			{typeof viewer === "object" &&
				(viewer.lessonId ? (
					<LinkButton
						href={`/aprender/${courseId}/${viewer.lessonId}`}
						className="min-h-[52px]"
					>
						Acessar curso
					</LinkButton>
				) : (
					<span className="text-center text-sm text-muted">
						Este curso ainda não tem aulas.{" "}
						<Link href="/" className="text-primary-soft">
							Ver outros cursos
						</Link>
					</span>
				))}
		</aside>
	);
}
