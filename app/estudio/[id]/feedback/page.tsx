"use client";
import { useState } from "react";
import { useCourse } from "../../../../components/course-ctx";
import { useLoad } from "../../../../components/studio";
import { Button, ConfirmDialog, useToast } from "../../../../components/ui";
import { calls, errorMessage, type Feedback } from "../../../../lib/api";

export default function CourseFeedback() {
	const { course } = useCourse();
	const toast = useToast();
	const { data, setData, error } = useLoad(
		() => calls.feedback(course.id),
		[course.id],
	);
	const [confirm, setConfirm] = useState<Feedback | null>(null);
	const [failed, setFailed] = useState("");

	async function hide(f: Feedback) {
		setConfirm(null);
		setFailed("");
		try {
			await calls.hideFeedback(course.id, f.id);
			setData(
				(cur) =>
					cur && {
						items: cur.items.filter((x) => x.id !== f.id),
						count: cur.count - 1,
					},
			);
			toast("Feedback ocultado");
		} catch (err) {
			setFailed(errorMessage(err));
		}
	}

	// The public list only exists for published courses; anything else reads as empty.
	const items = data?.items ?? [];
	return (
		<div className="flex max-w-3xl flex-col gap-5">
			<p className="text-muted">
				O feedback dos alunos aparece na página de vendas. Você pode ocultar um
				depoimento que não deva ficar público.
			</p>
			{failed && (
				<p role="alert" className="text-destructive-fg">
					{failed}
				</p>
			)}
			{!data && !error ? (
				<p role="status" className="text-muted">
					Carregando…
				</p>
			) : items.length === 0 ? (
				<p className="text-muted">Nenhum feedback visível por enquanto.</p>
			) : (
				<ul className="flex flex-col gap-4">
					{items.map((f) => (
						<li
							key={f.id}
							className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-[15px]"
						>
							<p className="whitespace-pre-line break-words">{f.text}</p>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<span className="text-muted">
									@{f.author.username} ·{" "}
									{new Date(f.createdAt).toLocaleDateString("pt-BR")}
								</span>
								<Button
									variant="danger"
									aria-label={`Ocultar o feedback de @${f.author.username}`}
									onClick={() => setConfirm(f)}
								>
									Ocultar
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
			{confirm && (
				<ConfirmDialog
					title={`Ocultar o feedback de @${confirm.author.username}?`}
					action="Ocultar"
					onCancel={() => setConfirm(null)}
					onConfirm={() => hide(confirm)}
				>
					Ele some da página de vendas e não dá para mostrar de novo por aqui.
				</ConfirmDialog>
			)}
		</div>
	);
}
