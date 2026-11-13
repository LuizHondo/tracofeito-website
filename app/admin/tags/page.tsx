"use client";
import { useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin";
import { useMe } from "../../../components/Me";
import { Button, ConfirmDialog, Field, useToast } from "../../../components/ui";
import { calls, errorMessage, type Tag } from "../../../lib/api";

function Row({
	tag,
	onRenamed,
	onDelete,
}: {
	tag: Tag;
	onRenamed: (t: Tag) => void;
	onDelete: () => void;
}) {
	const toast = useToast();
	const [name, setName] = useState(tag.name);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const changed = name.trim() !== "" && name.trim() !== tag.name;

	async function rename(e: React.FormEvent) {
		e.preventDefault();
		if (!tag.id || !changed) return;
		setBusy(true);
		setError("");
		try {
			const saved = await calls.renameTag(tag.id, name.trim());
			onRenamed({ ...tag, ...saved });
			toast("Tag renomeada");
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<li className="border-b border-border p-4 last:border-0">
			<form onSubmit={rename} className="flex flex-wrap items-start gap-3">
				<div className="flex-[1_1_240px]">
					<Field
						label={`Nome da tag ${tag.name}`}
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={40}
						error={error}
						hint={`Endereço no catálogo: ?tag=${tag.slug} (não muda ao renomear)`}
					/>
				</div>
				<div className="flex gap-3 pt-[26px]">
					<Button type="submit" variant="secondary" disabled={!changed || busy}>
						Renomear
					</Button>
					<Button
						variant="danger"
						aria-label={`Excluir a tag ${tag.name}`}
						onClick={onDelete}
					>
						Excluir
					</Button>
				</div>
			</form>
		</li>
	);
}

function Tags() {
	const toast = useToast();
	const [tags, setTags] = useState<Tag[] | null>(null);
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [listError, setListError] = useState("");
	const [busy, setBusy] = useState(false);
	const [confirm, setConfirm] = useState<Tag | null>(null);

	useEffect(() => {
		calls.tags().then(setTags, (e) => setListError(errorMessage(e)));
	}, []);

	async function create(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError("");
		try {
			await calls.createTag(name.trim());
			setTags(await calls.tags()); // the API orders by name
			setName("");
			toast("Tag criada");
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	async function remove(tag: Tag) {
		setConfirm(null);
		if (!tag.id) return;
		setListError("");
		try {
			await calls.deleteTag(tag.id);
			setTags((cur) => cur?.filter((t) => t.slug !== tag.slug) ?? null);
			toast("Tag excluída");
		} catch (err) {
			setListError(errorMessage(err));
		}
	}

	return (
		<>
			<form onSubmit={create} className="flex flex-wrap items-start gap-3">
				<div className="flex-[1_1_240px]">
					<Field
						label="Nova tag"
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={40}
						error={error}
						placeholder="Ex.: Concept Art"
					/>
				</div>
				<Button
					type="submit"
					disabled={!name.trim() || busy}
					className="mt-[26px]"
				>
					Criar tag
				</Button>
			</form>
			{listError && (
				<p role="alert" className="text-destructive-fg">
					{listError}
				</p>
			)}
			{!tags && !listError && (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			)}
			{tags?.length === 0 && (
				<p className="text-muted">
					Nenhuma tag ainda. Crie a primeira acima para os criadores usarem.
				</p>
			)}
			{tags && tags.length > 0 && (
				<ul className="rounded-2xl border border-border">
					{tags.map((t) => (
						<Row
							key={t.slug}
							tag={t}
							onRenamed={(saved) =>
								setTags(tags.map((x) => (x.slug === t.slug ? saved : x)))
							}
							onDelete={() => setConfirm(t)}
						/>
					))}
				</ul>
			)}
			{confirm && (
				<ConfirmDialog
					title={`Excluir a tag ${confirm.name}?`}
					action="Excluir"
					onCancel={() => setConfirm(null)}
					onConfirm={() => remove(confirm)}
				>
					Os cursos que usam essa tag vão perdê-la e o filtro some do catálogo.
					Não dá para desfazer.
				</ConfirmDialog>
			)}
		</>
	);
}

export default function AdminTags() {
	const { me } = useMe();
	return (
		<AdminShell title="Tags">{me?.role === "admin" && <Tags />}</AdminShell>
	);
}
