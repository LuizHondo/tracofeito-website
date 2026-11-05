"use client";
import Link from "next/link";
import { useState } from "react";
import { useCourse } from "../../../../components/course-ctx";
import { useLoad } from "../../../../components/studio";
import { Button, Field } from "../../../../components/ui";
import { ApiError, calls, errorMessage, type Page } from "../../../../lib/api";
import { treeOrder, withDepth } from "../../../../lib/learn";

const slugify = (t: string) =>
	t
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "aula";

export default function Lessons() {
	const { course } = useCourse();
	const { data, setData } = useLoad(
		() => calls.editorPages(course.id),
		[course.id],
	);
	const [error, setError] = useState("");
	const [renaming, setRenaming] = useState<string | null>(null);
	const [parentId, setParentId] = useState("");

	const reload = () => calls.editorPages(course.id).then(setData);
	const run = async (fn: () => Promise<unknown>) => {
		setError("");
		try {
			await fn();
			await reload();
		} catch (e) {
			setError(errorMessage(e));
		}
	};

	if (!data)
		return (
			<p role="status" className="text-muted">
				Carregando…
			</p>
		);
	const rows = withDepth(treeOrder(data));
	const siblings = (p: Page) =>
		data
			.filter((x) => x.parentId === p.parentId)
			.sort((a, b) => a.position - b.position);

	async function add(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = e.currentTarget;
		const title = String(new FormData(form).get("title") ?? "");
		const base = slugify(title);
		await run(async () => {
			for (let n = 1; ; n++) {
				try {
					await calls.createPage(course.id, {
						title,
						slug: n === 1 ? base : `${base}-${n}`,
						parentId: parentId || null,
					});
					return form.reset();
				} catch (err) {
					if (!(err instanceof ApiError && err.code === "slug_taken") || n > 20)
						throw err;
				}
			}
		});
	}

	return (
		<div className="flex flex-col gap-8">
			<ul className="flex flex-col gap-2">
				{rows.map((p) => {
					const sib = siblings(p);
					const i = sib.findIndex((x) => x.id === p.id);
					const parent = data.find((x) => x.id === p.parentId);
					const btn =
						"min-h-11 min-w-11 rounded-lg border border-border px-2 disabled:opacity-30";
					return (
						<li
							key={p.id}
							style={{ marginLeft: p.depth * 24 }}
							className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
						>
							{renaming === p.id ? (
								<form
									className="flex flex-1 gap-2"
									onSubmit={(e) => {
										e.preventDefault();
										const t = String(
											new FormData(e.currentTarget).get("title"),
										);
										setRenaming(null);
										run(() => calls.updatePage(course.id, p.id, { title: t }));
									}}
								>
									<input
										name="title"
										defaultValue={p.title}
										aria-label="Novo nome da aula"
										className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3"
									/>
									<Button type="submit">Salvar</Button>
								</form>
							) : (
								<Link
									href={`/estudio/${course.id}/aulas/${p.id}`}
									className="min-w-0 flex-1 truncate font-semibold"
								>
									{p.title}
								</Link>
							)}
							<button
								type="button"
								className={btn}
								aria-label={`Mover ${p.title} para cima`}
								disabled={i === 0}
								onClick={() =>
									run(() =>
										calls.updatePage(course.id, p.id, { position: i - 1 }),
									)
								}
							>
								↑
							</button>
							<button
								type="button"
								className={btn}
								aria-label={`Mover ${p.title} para baixo`}
								disabled={i === sib.length - 1}
								onClick={() =>
									run(() =>
										calls.updatePage(course.id, p.id, { position: i + 1 }),
									)
								}
							>
								↓
							</button>
							<button
								type="button"
								className={btn}
								aria-label={`Colocar ${p.title} dentro da aula anterior`}
								disabled={i === 0}
								onClick={() =>
									run(() =>
										calls.updatePage(course.id, p.id, {
											parentId: sib[i - 1]?.id,
										}),
									)
								}
							>
								→
							</button>
							<button
								type="button"
								className={btn}
								aria-label={`Tirar ${p.title} do nível`}
								disabled={!parent}
								onClick={() =>
									run(() =>
										calls.updatePage(course.id, p.id, {
											parentId: parent?.parentId ?? null,
											position: (parent?.position ?? 0) + 1,
										}),
									)
								}
							>
								←
							</button>
							<button
								type="button"
								className={btn}
								onClick={() => setRenaming(p.id)}
							>
								Renomear
							</button>
							<button
								type="button"
								className={`${btn} text-destructive-fg`}
								onClick={() =>
									confirm(
										`Excluir "${p.title}"? Os blocos e subaulas também somem.`,
									) && run(() => calls.deletePage(course.id, p.id))
								}
							>
								Excluir
							</button>
						</li>
					);
				})}
				{rows.length === 0 && (
					<li className="text-muted">
						Nenhuma aula ainda. Crie a primeira abaixo.
					</li>
				)}
			</ul>
			{error && (
				<p role="alert" className="text-destructive-fg">
					{error}
				</p>
			)}
			<form
				onSubmit={add}
				className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-5"
			>
				<h2 className="font-display text-2xl font-bold">Nova aula</h2>
				<Field name="title" label="Título" required maxLength={200} />
				<Field
					as="select"
					label="Dentro de"
					value={parentId}
					onChange={(e) => setParentId(e.target.value)}
					options={[
						{ value: "", label: "Nível principal" },
						...rows.map((r) => ({ value: r.id, label: r.title })),
					]}
				/>
				<Button type="submit" className="self-start">
					Criar aula
				</Button>
			</form>
		</div>
	);
}
