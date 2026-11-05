"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRequireUser } from "../../../components/Me";
import { Badge, Button } from "../../../components/ui";
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

function ConfirmSuspend({
	user,
	onCancel,
	onConfirm,
}: {
	user: AdminUser;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => ref.current?.showModal(), []);
	return (
		<dialog
			ref={ref}
			role="alertdialog"
			aria-labelledby="sus-t"
			aria-describedby="sus-d"
			onClose={onCancel}
			className="m-auto w-[min(92vw,440px)] rounded-2xl border border-border bg-card p-6 text-foreground backdrop:bg-black/60"
		>
			<h2 id="sus-t" className="font-display mb-2 text-2xl font-bold">
				Suspender @{user.username}?
			</h2>
			<p id="sus-d" className="mb-6 text-muted">
				As sessões dessa pessoa terminam agora e o login fica bloqueado até você
				restaurar a conta.
			</p>
			<div className="flex justify-end gap-3">
				<Button variant="secondary" onClick={onCancel}>
					Cancelar
				</Button>
				<Button variant="danger" onClick={onConfirm}>
					Suspender
				</Button>
			</div>
		</dialog>
	);
}

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

	if (!me) return null;
	if (!isAdmin)
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Página não encontrada
				</h1>
				<Link href="/" className="text-primary-soft">
					Voltar ao catálogo
				</Link>
			</main>
		);

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
		<main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-[clamp(16px,3vw,32px)] py-10 text-sm">
			<h1 className="font-display text-[40px] leading-none">Usuários</h1>
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
				<ConfirmSuspend
					user={confirm}
					onCancel={() => setConfirm(null)}
					onConfirm={() => {
						const u = confirm;
						setConfirm(null);
						run(() => calls.suspend(u.id), u.id, {
							suspendedAt: new Date().toISOString(),
						});
					}}
				/>
			)}
		</main>
	);
}
