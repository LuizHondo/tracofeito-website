"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Comment, calls, errorMessage, type Me } from "../lib/api";
import { addReply, removeComment, replaceComment } from "../lib/comments";
import { Markdown } from "./blocks";
import { Badge, Button, ConfirmDialog, Field, useToast } from "./ui";

const MAX = 5000;
const pending = (c: Comment) => c.id.startsWith("tmp-");
const action =
	"min-h-11 px-1 text-sm font-medium text-muted hover:text-foreground";

function CommentView({
	c,
	owner,
	canDelete,
	onReply,
	onDelete,
}: {
	c: Comment;
	owner: string | null;
	canDelete: boolean;
	onReply: () => void;
	onDelete: () => void;
}) {
	const isOwner = c.author.username === owner;
	return (
		<article className="flex flex-col gap-1.5">
			{c.deleted ? (
				<p className="text-muted italic">Comentário removido</p>
			) : (
				<>
					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
						{c.author.role === "creator" || isOwner ? (
							<Link
								href={`/criadores/${c.author.username}`}
								className="font-semibold text-primary-soft"
							>
								@{c.author.username}
							</Link>
						) : (
							<span className="font-semibold">@{c.author.username}</span>
						)}
						{isOwner && <Badge tone="discount">Criador</Badge>}
						<time dateTime={c.createdAt} className="text-muted">
							{pending(c)
								? "Enviando…"
								: new Date(c.createdAt).toLocaleString("pt-BR", {
										dateStyle: "short",
										timeStyle: "short",
									})}
						</time>
					</div>
					<Markdown>{c.body}</Markdown>
				</>
			)}
			{!pending(c) && (
				<div className="flex gap-4">
					<button type="button" onClick={onReply} className={action}>
						Responder
					</button>
					{canDelete && !c.deleted && (
						<button
							type="button"
							onClick={onDelete}
							aria-label={`Excluir comentário de @${c.author.username}`}
							className={action}
						>
							Excluir
						</button>
					)}
				</div>
			)}
		</article>
	);
}

/** Forum-style thread under a lesson: newest comments first, replies oldest first, optimistic posting. */
export function Comments({
	courseId,
	pageId,
	me,
}: {
	courseId: string;
	pageId: string;
	me: Me;
}) {
	const toast = useToast();
	const [items, setItems] = useState<Comment[] | null>(null);
	const [cursor, setCursor] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [busy, setBusy] = useState(false);
	const [text, setText] = useState("");
	const [reply, setReply] = useState<{ to: string; text: string } | null>(null);
	const [confirm, setConfirm] = useState<Comment | null>(null);
	const [owner, setOwner] = useState<string | null>(null);
	const [status, setStatus] = useState("");
	const tmp = useRef(0);

	const load = useCallback(() => {
		setFailed(false);
		calls.comments(courseId, pageId).then(
			(p) => {
				setItems(p.items);
				setCursor(p.nextCursor);
			},
			() => setFailed(true),
		);
	}, [courseId, pageId]);
	useEffect(load, [load]);

	// ponytail: the owner comes from the public selling payload, so the badge and
	// owner moderation are missing on an unpublished course. Use a per-comment
	// `isOwner` if the API starts returning one.
	useEffect(() => {
		calls.selling(courseId).then(
			(s) => setOwner(s.course.owner.username),
			() => {},
		);
	}, [courseId]);

	// Cosmetic only: the API enforces who may delete.
	const canDelete = (c: Comment) =>
		c.author.username === me.username ||
		me.role === "admin" ||
		me.username === owner;

	/** Shows the comment right away, then swaps in the server's or rolls back. */
	async function post(body: string, parentId?: string): Promise<boolean> {
		const temp: Comment = {
			id: `tmp-${++tmp.current}`,
			body,
			createdAt: new Date().toISOString(),
			deleted: false,
			author: { username: me.username, role: me.role },
			replies: parentId ? undefined : [],
		};
		setItems((cur) =>
			parentId ? addReply(cur ?? [], parentId, temp) : [temp, ...(cur ?? [])],
		);
		try {
			const saved = await calls.addComment(courseId, pageId, body, parentId);
			setItems((cur) => replaceComment(cur ?? [], temp.id, saved));
			setStatus(parentId ? "Resposta publicada" : "Comentário publicado");
			return true;
		} catch (e) {
			setItems((cur) => removeComment(cur ?? [], temp.id));
			toast(errorMessage(e));
			return false;
		}
	}

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const body = text.trim();
		if (!body) return;
		setText("");
		setBusy(true);
		if (!(await post(body))) setText((cur) => cur || body);
		setBusy(false);
	}

	async function submitReply(e: React.FormEvent) {
		e.preventDefault();
		const r = reply;
		const body = r?.text.trim();
		if (!r || !body) return;
		setReply(null);
		if (!(await post(body, r.to))) setReply((cur) => cur ?? r);
	}

	async function more() {
		if (!cursor) return;
		setBusy(true);
		try {
			const p = await calls.comments(courseId, pageId, cursor);
			setItems((cur) => {
				const seen = new Set((cur ?? []).map((c) => c.id));
				return [...(cur ?? []), ...p.items.filter((c) => !seen.has(c.id))];
			});
			setCursor(p.nextCursor);
			setStatus("Mais comentários carregados");
		} catch (e) {
			toast(errorMessage(e));
		} finally {
			setBusy(false);
		}
	}

	async function remove(c: Comment) {
		setConfirm(null);
		try {
			await calls.deleteComment(courseId, c.id);
			setItems((cur) => removeComment(cur ?? [], c.id));
			setStatus("Comentário excluído");
		} catch (e) {
			toast(errorMessage(e));
		}
	}

	const view = (c: Comment) => (
		<CommentView
			c={c}
			owner={owner}
			canDelete={canDelete(c)}
			onReply={() => setReply({ to: c.id, text: "" })}
			onDelete={() => setConfirm(c)}
		/>
	);

	return (
		<section
			aria-labelledby="comentarios"
			className="flex flex-col gap-6 border-t border-border pt-8"
		>
			<h2 id="comentarios" className="font-display text-[28px] leading-tight">
				Comentários
			</h2>
			<p role="status" className="sr-only">
				{status}
			</p>
			<form onSubmit={submit} className="flex flex-col gap-3">
				<Field
					as="textarea"
					label="Seu comentário"
					rows={3}
					value={text}
					onChange={(e) => setText(e.target.value)}
					maxLength={MAX}
					hint="Aceita Markdown. Tire dúvidas ou conte o que achou da aula."
				/>
				<Button
					type="submit"
					disabled={!text.trim() || busy}
					className="self-start"
				>
					Comentar
				</Button>
			</form>

			{failed ? (
				<div role="alert" className="flex flex-wrap items-center gap-4">
					<span className="text-destructive-fg">
						Não conseguimos carregar os comentários.
					</span>
					<Button variant="secondary" onClick={load}>
						Tentar de novo
					</Button>
				</div>
			) : !items ? (
				<p role="status" className="text-muted">
					Carregando comentários…
				</p>
			) : items.length === 0 ? (
				<p className="text-muted">Seja o primeiro a comentar</p>
			) : (
				<ul className="flex flex-col gap-6">
					{items.map((c) => (
						<li
							key={c.id}
							className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
						>
							{view(c)}
							{((c.replies?.length ?? 0) > 0 ||
								(reply && inThread(c, reply.to))) && (
								<div className="flex flex-col gap-4 border-l-2 border-border pl-4 sm:ml-4">
									{(c.replies?.length ?? 0) > 0 && (
										<ul className="flex flex-col gap-4">
											{c.replies?.map((r) => (
												<li key={r.id}>{view(r)}</li>
											))}
										</ul>
									)}
									{reply && inThread(c, reply.to) && (
										<form
											onSubmit={submitReply}
											className="flex flex-col gap-3"
										>
											<Field
												as="textarea"
												label="Sua resposta"
												rows={2}
												value={reply.text}
												onChange={(e) =>
													setReply({ to: reply.to, text: e.target.value })
												}
												maxLength={MAX}
												autoFocus
											/>
											<div className="flex gap-3">
												<Button type="submit" disabled={!reply.text.trim()}>
													Responder
												</Button>
												<Button
													variant="secondary"
													onClick={() => setReply(null)}
												>
													Cancelar
												</Button>
											</div>
										</form>
									)}
								</div>
							)}
						</li>
					))}
				</ul>
			)}
			{cursor && !failed && (
				<Button
					variant="secondary"
					disabled={busy}
					onClick={more}
					className="self-center"
				>
					Ver mais comentários
				</Button>
			)}
			{confirm && (
				<ConfirmDialog
					title="Excluir comentário?"
					action="Excluir"
					onCancel={() => setConfirm(null)}
					onConfirm={() => remove(confirm)}
				>
					O texto é apagado e não dá para recuperar. As respostas continuam
					visíveis.
				</ConfirmDialog>
			)}
		</section>
	);
}

const inThread = (c: Comment, id: string) =>
	c.id === id || !!c.replies?.some((r) => r.id === id);
