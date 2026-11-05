"use client";
import Link from "next/link";
import { useRequireUser } from "../../../components/Me";
import { useLoad } from "../../../components/studio";
import { Badge, Button, useToast } from "../../../components/ui";
import {
	calls,
	errorMessage,
	type MySubscription,
	money,
} from "../../../lib/api";

const date = (iso: string | null) =>
	iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

const chargeLabel = {
	pending: "Aguardando pagamento",
	expired: "Vencida",
	paid: "Paga",
	refunded: "Estornada",
};

function Card({ sub, reload }: { sub: MySubscription; reload: () => void }) {
	const toast = useToast();
	const recurring = sub.expiresAt !== null;
	async function renew() {
		try {
			window.location.assign((await calls.renew(sub.course.id, {})).url);
		} catch (err) {
			toast(errorMessage(err));
		}
	}
	async function cancel() {
		if (
			!window.confirm(
				"Cancelar a renovação? Você mantém o acesso até a data de expiração.",
			)
		)
			return;
		await calls.cancelSubscription(sub.id);
		toast("Renovação cancelada");
		reload();
	}
	return (
		<li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<Link
						href={`/cursos/${sub.course.id}`}
						className="font-display text-2xl"
					>
						{sub.course.title}
					</Link>
					<span className="text-muted">
						{recurring
							? `${sub.warning === "expired" ? "Expirou em" : "Acesso até"} ${date(sub.expiresAt)}`
							: "Acesso vitalício"}
						{sub.canceledAt && " · renovação cancelada"}
					</span>
				</div>
				{sub.warning === "expired" && <Badge tone="neutral">Expirada</Badge>}
				{sub.warning === "expiring" && (
					<Badge tone="discount">Expira em breve</Badge>
				)}
			</div>
			{recurring && (
				<div className="flex flex-wrap gap-3">
					<Button onClick={renew}>Renovar</Button>
					{!sub.canceledAt && sub.warning !== "expired" && (
						<Button variant="secondary" onClick={cancel}>
							Cancelar renovação
						</Button>
					)}
				</div>
			)}
			<details>
				<summary className="cursor-pointer text-muted">
					Histórico de pagamentos
				</summary>
				<ul className="mt-3 flex flex-col gap-2">
					{sub.charges.map((c) => (
						<li key={c.id} className="flex flex-wrap justify-between gap-2">
							<span>
								{date(c.paidAt ?? c.createdAt)} · {chargeLabel[c.status]}
								{c.status === "pending" && (
									<>
										{" · "}
										<a href={c.url} className="text-primary-soft">
											pagar
										</a>
									</>
								)}
							</span>
							<span className="tabular-nums">{money(c.amountCents)}</span>
						</li>
					))}
				</ul>
			</details>
		</li>
	);
}

export default function Subscriptions() {
	const me = useRequireUser();
	const { data, setData } = useLoad(calls.mySubscriptions, [me?.id]);
	if (!me) return null;
	return (
		<main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-14 text-sm">
			<h1 className="font-display text-[40px] leading-none">
				Minhas assinaturas
			</h1>
			{!data ? (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			) : data.length === 0 ? (
				<p className="text-muted">
					Você ainda não assinou nenhum curso.{" "}
					<Link href="/" className="text-primary-soft">
						Ver cursos
					</Link>
				</p>
			) : (
				<ul className="flex flex-col gap-4">
					{data.map((s) => (
						<Card
							key={s.id}
							sub={s}
							reload={() => calls.mySubscriptions().then(setData)}
						/>
					))}
				</ul>
			)}
		</main>
	);
}
