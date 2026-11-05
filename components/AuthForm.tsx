"use client";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { errorMessage, getMe } from "../lib/api";
import { useMe } from "./Me";
import { Button, Field } from "./ui";

export type FieldDef = {
	name: string;
	label: string;
	type?: string;
	autoComplete?: string;
};

/** One form for every auth screen: fields in, `submit(values)` out, error linked to the last field. */
export function AuthForm({
	title,
	fields,
	submit,
	submitLabel,
	redirectTo,
	doneMessage,
	footer,
}: {
	title: string;
	fields: FieldDef[];
	submit: (values: Record<string, string>) => Promise<unknown>;
	submitLabel: string;
	redirectTo?: string;
	doneMessage?: string;
	footer?: ReactNode;
}) {
	const router = useRouter();
	const { setMe } = useMe();
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);
	const [busy, setBusy] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setBusy(true);
		setError("");
		try {
			await submit(
				Object.fromEntries(new FormData(e.currentTarget)) as Record<
					string,
					string
				>,
			);
			setMe(await getMe().catch(() => null));
			if (redirectTo) router.push(redirectTo);
			else setDone(true);
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="mx-auto max-w-sm px-4 py-14">
			<h1 className="font-display mb-8 text-[40px] leading-none">{title}</h1>
			{done ? (
				<p role="status">{doneMessage}</p>
			) : (
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					{fields.map((f, i) => (
						<Field
							key={f.name}
							name={f.name}
							label={f.label}
							type={f.type ?? "text"}
							autoComplete={f.autoComplete}
							required
							error={i === fields.length - 1 ? error : undefined}
						/>
					))}
					<Button type="submit" disabled={busy}>
						{submitLabel}
					</Button>
				</form>
			)}
			{footer && (
				<div className="mt-6 text-sm text-muted [&_a]:text-primary-soft">
					{footer}
				</div>
			)}
		</main>
	);
}
