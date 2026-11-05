"use client";
import Link from "next/link";
import { StudioGate, useLoad, VerifyBanner } from "../../components/studio";
import { Badge, Button, Cover, LinkButton } from "../../components/ui";
import { calls, money } from "../../lib/api";
import { readiness } from "../../lib/studio";

function List() {
	const { data: courses } = useLoad(calls.myCourses, []);
	if (!courses)
		return (
			<p role="status" className="text-muted">
				Carregando…
			</p>
		);
	if (courses.length === 0)
		return (
			<section className="flex flex-col gap-8 rounded-2xl border border-border bg-card p-8">
				<div>
					<h2 className="font-display text-[32px]">Ainda não tem nada aqui</h2>
					<p className="text-muted">
						Que tal criar seu primeiro curso? São três passos.
					</p>
				</div>
				<ol className="grid gap-4 sm:grid-cols-3">
					{[
						["Crie o curso", "Título, capa e preço base."],
						["Defina os planos", "Mensal, anual ou vitalício."],
						["Monte as aulas", "Seções, vídeos e textos."],
					].map(([t, d], i) => (
						<li key={t} className="flex gap-3">
							<span className="flex size-8 flex-none items-center justify-center rounded-full border border-silver/60 text-sm font-semibold">
								{i + 1}
							</span>
							<span className="flex flex-col">
								<strong>{t}</strong>
								<span className="text-sm text-muted">{d}</span>
							</span>
						</li>
					))}
				</ol>
			</section>
		);
	const outside = courses.some((c) => c.published && c._count.plans === 0);
	return (
		<>
			<div className="overflow-x-auto rounded-2xl border border-border">
				<table className="w-full min-w-[720px] text-left text-sm">
					<thead className="border-b border-border text-muted">
						<tr>
							{["Curso", "Preço base", "Status", "Preparo", ""].map((h) => (
								<th
									key={h || "a"}
									scope="col"
									className="px-4 py-3 font-medium"
								>
									{h || <span className="sr-only">Ações</span>}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{courses.map((c) => {
							const n = readiness(c);
							return (
								<tr key={c.id} className="border-b border-border last:border-0">
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<Cover
												id={c.id}
												title={c.title}
												coverUrl={c.coverUrl}
												size={36}
												className="w-24 flex-none rounded-lg"
											/>
											<div className="flex min-w-0 flex-col">
												<Link
													href={`/estudio/${c.id}/configuracoes`}
													className="font-semibold"
												>
													{c.title}
												</Link>
												<span className="text-muted">
													{c.published && c._count.plans === 0
														? "Sem plano: fora do catálogo"
														: `${c._count.plans} ${c._count.plans === 1 ? "plano" : "planos"} · ${c._count.pages} ${c._count.pages === 1 ? "aula" : "aulas"}`}
												</span>
											</div>
										</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										{money(c.baseMonthlyCents)}
										{c.paymentType === "subscription" && (
											<span className="text-muted">/mês</span>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-1.5">
											{c.published ? (
												<Badge tone="success">Publicado</Badge>
											) : (
												<Badge tone="neutral">Rascunho</Badge>
											)}
											{c.featured && (
												<Badge
													tone="featured"
													className="px-2.5 py-0.5 text-[11px]"
												>
													Em destaque
												</Badge>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span className="h-1.5 w-16 overflow-hidden rounded-full bg-card-muted">
												<span
													className="block h-full bg-primary"
													style={{ width: `${(n / 7) * 100}%` }}
												/>
											</span>
											<span className="whitespace-nowrap">
												{n === 7 ? "Pronto" : `${n} de 7`}
											</span>
										</div>
									</td>
									<td className="px-4 py-3 text-right">
										<Link
											href={`/estudio/${c.id}/configuracoes`}
											className="font-semibold text-primary-soft"
										>
											Editar
										</Link>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			{outside && (
				<p className="text-sm text-muted">
					Curso publicado sem plano não aparece no catálogo.
				</p>
			)}
		</>
	);
}

export default function Studio() {
	return (
		<StudioGate>
			{(me) => (
				<>
					<VerifyBanner />
					<main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-[clamp(16px,3vw,32px)] py-10 text-sm">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<h1 className="font-display text-[40px] leading-none">
								Meus cursos
							</h1>
							<div className="flex flex-wrap gap-3">
								<LinkButton href="/estudio/painel" variant="secondary">
									Painel de vendas
								</LinkButton>
								{me.emailVerified ? (
									<LinkButton href="/estudio/novo">+ Novo curso</LinkButton>
								) : (
									<Button disabled>+ Novo curso</Button>
								)}
							</div>
						</div>
						<List />
					</main>
				</>
			)}
		</StudioGate>
	);
}
