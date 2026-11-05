"use client";
import Link from "next/link";
import { useState } from "react";
import { useMe, useRequireUser } from "../../components/Me";
import { Button, Field, useToast } from "../../components/ui";
import { api, errorMessage, type Me } from "../../lib/api";

export default function Account() {
	const me = useRequireUser();
	const { setMe } = useMe();
	const toast = useToast();
	const [error, setError] = useState("");
	if (!me) return null;

	async function save(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
			string,
			string
		>;
		const body = {
			username: v.username,
			bio: v.bio,
			...(v.newPassword && {
				newPassword: v.newPassword,
				currentPassword: v.currentPassword,
			}),
		};
		try {
			setMe(await api<Me>("/auth/me", "PATCH", body));
			toast("Perfil atualizado");
		} catch (err) {
			setError(errorMessage(err));
		}
	}

	return (
		<main className="mx-auto max-w-lg px-4 py-14">
			<h1 className="font-display mb-3 text-[40px] leading-none">Seu perfil</h1>
			<Link
				href="/conta/assinaturas"
				className="mb-8 inline-block text-primary-soft"
			>
				Minhas assinaturas
			</Link>
			{me.role !== "user" && (
				<Link
					href="/conta/pagamentos"
					className="mb-8 ml-6 inline-block text-primary-soft"
				>
					Pagamentos
				</Link>
			)}
			<form onSubmit={save} className="flex flex-col gap-4">
				<Field
					name="username"
					label="Nome de usuário"
					defaultValue={me.username}
					required
				/>
				<Field
					as="textarea"
					name="bio"
					label="Bio"
					defaultValue={me.bio}
					rows={4}
					maxLength={500}
				/>
				<Field
					name="currentPassword"
					type="password"
					label="Senha atual"
					autoComplete="current-password"
					hint="Só preencha para trocar a senha."
				/>
				<Field
					name="newPassword"
					type="password"
					label="Nova senha (mín. 8 caracteres)"
					autoComplete="new-password"
					error={error}
				/>
				<Button type="submit">Salvar</Button>
			</form>
		</main>
	);
}
