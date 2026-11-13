"use client";
import { useEffect, useState } from "react";
import { calls, errorMessage } from "../lib/api";
import { Button, Field, useToast } from "./ui";

const MIN_WORDS = 10;
const MAX_CHARS = 2000;

/** Course feedback at the end of the last lesson. The word count is only a hint; the API decides. */
export function FeedbackForm({ courseId }: { courseId: string }) {
	const toast = useToast();
	const [text, setText] = useState("");
	const [exists, setExists] = useState(false);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		// 404 means no entry yet: the form just stays empty.
		calls.myFeedback(courseId).then(
			(f) => {
				setText(f.text);
				setExists(true);
			},
			() => {},
		);
	}, [courseId]);

	const words = text.trim().split(/\s+/).filter(Boolean).length;
	const missing = MIN_WORDS - words;

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (missing > 0) return;
		setBusy(true);
		setError("");
		try {
			await calls.sendFeedback(courseId, text.trim());
			toast(exists ? "Feedback atualizado" : "Feedback enviado. Valeu!");
			setExists(true);
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<section
			aria-labelledby="feedback-form"
			className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
		>
			<h2 id="feedback-form" className="font-display text-[28px] leading-tight">
				Conte como foi o curso
			</h2>
			<form onSubmit={submit} className="flex flex-col gap-4">
				<Field
					as="textarea"
					label="Seu feedback"
					rows={5}
					value={text}
					onChange={(e) => setText(e.target.value)}
					maxLength={MAX_CHARS}
					error={error}
					hint={
						missing > 0
							? `${words} de ${MIN_WORDS} palavras. ${missing === 1 ? "Falta 1 palavra" : `Faltam ${missing} palavras`}.`
							: `${words} palavras · ${text.length} de ${MAX_CHARS} caracteres`
					}
				/>
				<Button
					type="submit"
					disabled={missing > 0 || busy}
					className="self-start"
				>
					{exists ? "Atualizar feedback" : "Enviar feedback"}
				</Button>
			</form>
		</section>
	);
}
