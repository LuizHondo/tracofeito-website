"use client";
import Link from "next/link";
import { useState } from "react";
import { useMe, useRequireUser } from "../../components/Me";
import { Button, Field, useToast } from "../../components/ui";
import {
	api,
	errorMessage,
	MAX_SOCIAL_LINKS,
	type Me,
	type SocialKind,
	type SocialLink,
	socialLabels,
} from "../../lib/api";

const kinds = Object.entries(socialLabels).map(([value, label]) => ({
	value,
	label,
}));

export default function Account() {
	const me = useRequireUser();
	const { setMe } = useMe();
	const toast = useToast();
	const [error, setError] = useState("");
	// null until edited, so the saved links show as soon as the session loads.
	const [edited, setEdited] = useState<SocialLink[] | null>(null);
	if (!me) return null;
	const links = edited ?? me.socialLinks ?? [];
	const setLink = (i: number, p: Partial<SocialLink>) =>
		setEdited(links.map((l, j) => (j === i ? { ...l, ...p } : l)));

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
			avatarUrl: (v.avatarUrl ?? "").trim(),
			// Rows left blank are dropped; anything typed goes to the API as is.
			socialLinks: links
				.map((l) => ({ ...l, url: l.url.trim() }))
				.filter((l) => l.url),
			...(v.newPassword && {
				newPassword: v.newPassword,
				currentPassword: v.currentPassword,
			}),
		};
		try {
			setMe(await api<Me>("/auth/me", "PATCH", body));
			setEdited(null);
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
					name="avatarUrl"
					type="url"
					label="Endereço da foto (opcional)"
					defaultValue={me.avatarUrl ?? ""}
					maxLength={500}
					hint="Link de uma imagem. Sem foto, mostramos suas iniciais."
				/>
				<fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
					<legend className="mb-1.5 text-sm font-medium">
						Redes sociais ({links.length} de {MAX_SOCIAL_LINKS})
					</legend>
					{links.map((l, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: rows have no id and are controlled, so position is the identity
							key={i}
							className="flex flex-wrap items-end gap-3"
						>
							<div className="flex-[1_1_140px]">
								<Field
									as="select"
									label={`Rede ${i + 1}`}
									value={l.kind}
									onChange={(e) =>
										setLink(i, { kind: e.target.value as SocialKind })
									}
									options={kinds}
								/>
							</div>
							<div className="flex-[3_1_220px]">
								<Field
									type="url"
									label={`Endereço do link ${i + 1}`}
									value={l.url}
									onChange={(e) => setLink(i, { url: e.target.value })}
									placeholder="https://"
								/>
							</div>
							<Button
								variant="secondary"
								aria-label={`Remover link ${i + 1}`}
								onClick={() => setEdited(links.filter((_, j) => j !== i))}
							>
								Remover
							</Button>
						</div>
					))}
					<Button
						variant="secondary"
						className="self-start"
						disabled={links.length >= MAX_SOCIAL_LINKS}
						onClick={() =>
							setEdited([...links, { kind: "instagram", url: "" }])
						}
					>
						Adicionar link
					</Button>
					{links.length >= MAX_SOCIAL_LINKS && (
						<span className="text-[13px] text-muted">
							Você chegou ao limite de {MAX_SOCIAL_LINKS} links.
						</span>
					)}
				</fieldset>
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
				/>
				{error && (
					<p role="alert" className="text-sm text-destructive-fg">
						{error}
					</p>
				)}
				<Button type="submit">Salvar</Button>
			</form>
		</main>
	);
}
