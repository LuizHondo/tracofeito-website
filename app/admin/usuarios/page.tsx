"use client";
import { useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin";
import { useRequireUser } from "../../../components/Me";
import { Badge, Button, ConfirmDialog } from "../../../components/ui";
import {
	type AdminUser,
	calls,
	errorMessage,
	type Role,
} from "../../../lib/api";

const roles: { value: Role; label: string }[] = [
	{ value: "user", label: "Aluno" },
	{ value: "creator", label: "Criador" },
	{ value: "admin", label: "Admin" },
];
const field =
	"min-h-11 rounded-xl border border-border bg-background px-3.5 text-[15px] disabled:opacity-50";

export default function AdminUsers() {
	const me = useRequireUser();
	const [q, setQ] = useState("");
	const [role, setRole] = useState("");
	const [users, setUsers] = useState<AdminUser[] | null>(null);
	const [error, setError] = useState("");
	const [confirm, setConfirm] = useState<AdminUser | null>(null);
	const isAdmin = me?.role === "admin";

	useEffect(() => {
		if (!isAdmin) return;
		const t = setTimeout(
			() =>
				calls
					.adminUsers(q, role)
					.then(setUsers, (e) => setError(errorMessage(e))),
			300,
		);
		return () => clearTimeout(t);
	}, [isAdmin, q, role]);

	if (!me || !isAdmin) return <AdminShell title="Usuários">{null}</AdminShell>;

	const apply = (id: string, p: Partial<AdminUser>) =>
		setUsers((u) => u?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null);
	async function run(
		fn: () => Promise<unknown>,
		id: string,
		p: Partial<AdminUser>,
	) {
		setError("");
		try {
			await fn();
			apply(id, p);
		} catch (e) {
			setError(errorMessage(e));
		}
	}

	return (
		<AdminShell title="Usuários">
			<div className="flex flex-wrap gap-3">
				<input
					type="search"
					aria-label="Buscar por email ou usuário"
					placeholder="Buscar por email ou usuário"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					className={`${field} min-w-64 flex-1`}
				/>
				<select
					aria-label="Filtrar por papel"
					value={role}
					onChange={(e) => setRole(e.target.value)}
					className={field}
				>
					<option value="">Todos os papéis</option>
					{roles.map((r) => (
						<option key={r.value} value={r.value}>
							{r.label}
						</option>
					))}
				</select>
			</div>
			{error && (
				<p role="alert" className="text-destructive-fg">
					{error}
				</p>
			)}
			<div className="overflow-x-auto rounded-2xl border border-border">
				<table className="w-full min-w-[760px] text-left">
					<thead className="border-b border-border text-muted">
						<tr>
							{["Usuário", "Papel", "Status", "Criado em", ""].map((h) => (
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
						{users?.map((u) => {
							const self = u.id === me.id;
							return (
								<tr key={u.id} className="border-b border-border last:border-0">
									<td className="px-4 py-3">
										<div className="flex flex-col">
											<span className="font-semibold">@{u.username}</span>
											<span className="text-muted">{u.email}</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<select
											aria-label={`Papel de @${u.username}`}
											value={u.role}
											disabled={self}
											onChange={(e) =>
												run(
													() => calls.setRole(u.id, e.target.value as Role),
													u.id,
													{ role: e.target.value as Role },
												)
											}
											className={field}
										>
											{roles.map((r) => (
												<option key={r.value} value={r.value}>
													{r.label}
												</option>
											))}
										</select>
									</td>
									<td className="px-4 py-3">
										{u.suspendedAt ? (
											<Badge tone="danger">Suspenso</Badge>
										) : (
											<Badge tone="success">Ativo</Badge>
										)}
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										{new Date(u.createdAt).toLocaleDateString("pt-BR")}
									</td>
									<td className="px-4 py-3 text-right">
										{self ? (
											<span className="text-muted">
												Você não pode alterar a própria conta
											</span>
										) : u.suspendedAt ? (
											<Button
												variant="secondary"
												onClick={() =>
													run(() => calls.restore(u.id), u.id, {
														suspendedAt: null,
													})
												}
											>
												Restaurar
											</Button>
										) : (
											<Button variant="danger" onClick={() => setConfirm(u)}>
												Suspender
											</Button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			{users?.length === 0 && (
				<p className="text-muted">Ninguém encontrado com esses filtros.</p>
			)}
			{users?.length === 100 && (
				<p className="text-muted">
					Mostrando os 100 primeiros resultados. Refine a busca.
				</p>
			)}
			{confirm && (
				<ConfirmDialog
					title={`Suspender @${confirm.username}?`}
					action="Suspender"
					onCancel={() => setConfirm(null)}
					onConfirm={() => {
						const u = confirm;
						setConfirm(null);
						run(() => calls.suspend(u.id), u.id, {
							suspendedAt: new Date().toISOString(),
						});
					}}
				>
					As sessões dessa pessoa terminam agora e o login fica bloqueado até
					você restaurar a conta.
				</ConfirmDialog>
			)}
		</AdminShell>
	);
}
