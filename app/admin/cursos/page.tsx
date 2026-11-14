"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin";
import { useMe } from "../../../components/Me";
import { Button, Cover, LinkButton } from "../../../components/ui";
import { type AdminCourse, calls, errorMessage, money } from "../../../lib/api";

/** Phone: each row is a 2-column card with inline labels. md+: a plain table. */
const cell =
	"flex flex-col gap-1 md:table-cell md:px-4 md:py-3 md:whitespace-nowrap";
const label = "text-xs text-muted md:hidden";
const toggle = "min-h-9 w-full px-3 text-sm md:w-auto";

function Courses() {
	const [courses, setCourses] = useState<AdminCourse[] | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		calls.adminCourses().then(setCourses, (e) => setError(errorMessage(e)));
	}, []);

	async function run(
		fn: () => Promise<unknown>,
		id: string,
		p: Partial<AdminCourse>,
	) {
		setError("");
		try {
			await fn();
			setCourses(
				(cs) => cs?.map((c) => (c.id === id ? { ...c, ...p } : c)) ?? null,
			);
		} catch (e) {
			setError(errorMessage(e));
		}
	}

	return (
		<>
			{error && (
				<p role="alert" className="text-destructive-fg">
					{error}
				</p>
			)}
			{!courses && !error && (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			)}
			{courses?.length === 0 && (
				<p className="text-muted">Nenhum curso criado ainda.</p>
			)}
			{courses && courses.length > 0 && (
				<div className="rounded-2xl border border-border">
					<table className="block w-full text-left md:table">
						<thead className="hidden border-b border-border text-muted md:table-header-group">
							<tr>
								{[
									"Curso",
									"Criador",
									"Preço base",
									"Publicado",
									"Destaque",
									"",
								].map((h) => (
									<th
										key={h || "a"}
										scope="col"
										className={`px-4 py-3 font-medium whitespace-nowrap ${h === "Curso" ? "w-full" : ""}`}
									>
										{h || <span className="sr-only">Ações</span>}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="block md:table-row-group">
							{courses.map((c) => (
								<tr
									key={c.id}
									className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border p-4 last:border-0 md:table-row md:p-0"
								>
									<td className="col-span-2 md:table-cell md:px-4 md:py-3">
										<div className="flex items-center gap-3">
											<Cover
												id={c.id}
												title={c.title}
												coverUrl={c.coverUrl}
												size={36}
												className="w-24 flex-none rounded-lg"
											/>
											<Link
												href={`/estudio/${c.id}/configuracoes`}
												className="min-w-0 truncate font-semibold"
											>
												{c.title}
											</Link>
										</div>
									</td>
									<td className={cell}>
										<span className={label}>Criador</span>
										<Link href={`/criadores/${c.owner.username}`}>
											@{c.owner.username}
										</Link>
									</td>
									<td className={cell}>
										<span className={label}>Preço base</span>
										<span>
											{money(c.baseMonthlyCents)}
											{c.paymentType === "subscription" && (
												<span className="text-muted">/mês</span>
											)}
										</span>
									</td>
									<td className={cell}>
										<span className={label}>Publicado</span>
										<Button
											variant="secondary"
											aria-pressed={c.published}
											className={`${toggle} ${c.published ? "squishy-success" : ""}`}
											onClick={() =>
												run(
													() =>
														calls.updateCourse(c.id, {
															published: !c.published,
														}),
													c.id,
													{ published: !c.published },
												)
											}
										>
											{c.published ? "Publicado" : "Rascunho"}
										</Button>
									</td>
									<td className={cell}>
										<span className={label}>Destaque</span>
										<Button
											variant="secondary"
											aria-pressed={c.featured}
											className={`${toggle} ${c.featured ? "squishy-primary" : ""}`}
											onClick={() =>
												run(() => calls.setFeatured(c.id, !c.featured), c.id, {
													featured: !c.featured,
												})
											}
										>
											{c.featured ? "Em destaque" : "Sem destaque"}
										</Button>
									</td>
									<td className="col-span-2 md:table-cell md:px-4 md:py-3">
										<LinkButton
											href={`/estudio/${c.id}/configuracoes`}
											variant="secondary"
											className="w-full md:w-auto"
										>
											Editar
										</LinkButton>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</>
	);
}

export default function AdminCourses() {
	const { me } = useMe();
	return (
		<AdminShell title="Cursos">
			{me?.role === "admin" && <Courses />}
		</AdminShell>
	);
}
