"use client";
import Link from "next/link";
import {
	type ButtonHTMLAttributes,
	createContext,
	type InputHTMLAttributes,
	type ReactNode,
	type SelectHTMLAttributes,
	type TextareaHTMLAttributes,
	useCallback,
	useContext,
	useId,
	useRef,
	useState,
} from "react";

const cx = (...c: (string | false | undefined)[]) =>
	c.filter(Boolean).join(" ");

const buttonStyles = {
	primary: "bg-primary text-primary-fg font-semibold",
	secondary: "border border-border bg-transparent text-foreground font-medium",
	danger:
		"border border-destructive/50 bg-destructive/10 text-destructive-fg font-medium",
	ghost: "text-foreground font-medium hover:bg-card-muted",
} as const;
type Variant = keyof typeof buttonStyles;
const buttonBase =
	"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] disabled:cursor-not-allowed disabled:border disabled:border-border disabled:bg-card-muted disabled:text-muted";

export function Button({
	variant = "primary",
	className,
	...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
	return (
		<button
			type="button"
			{...p}
			className={cx(buttonBase, buttonStyles[variant], className)}
		/>
	);
}

export function LinkButton({
	variant = "primary",
	className,
	href,
	children,
}: {
	variant?: Variant;
	className?: string;
	href: string;
	children: ReactNode;
}) {
	return (
		<Link
			href={href}
			className={cx(buttonBase, buttonStyles[variant], className)}
		>
			{children}
		</Link>
	);
}

const badgeStyles = {
	featured:
		"text-[12px] font-semibold uppercase tracking-[0.2em] text-background bg-gradient-to-br from-[oklch(0.92_0.008_85)] to-[oklch(0.7_0.008_80)] px-3 py-1.5 rounded-full",
	price:
		"text-sm font-semibold text-primary-soft bg-primary/15 px-3 py-1.5 rounded-lg",
	discount:
		"text-[13px] font-semibold text-primary-soft bg-primary/15 px-2.5 py-1 rounded-lg",
	success:
		"text-[13px] font-medium text-success bg-success/15 px-2.5 py-1 rounded-full",
	neutral:
		"text-[13px] font-medium text-muted border border-border px-2.5 py-0.5 rounded-full",
	warning:
		"text-[13px] font-medium text-warning bg-warning/15 px-2.5 py-1 rounded-full",
	danger:
		"text-[13px] font-medium text-destructive-fg bg-destructive/15 px-2.5 py-1 rounded-full",
} as const;

export function Badge({
	tone,
	children,
	className,
}: {
	tone: keyof typeof badgeStyles;
	children: ReactNode;
	className?: string;
}) {
	return (
		<span className={cx(badgeStyles[tone], "whitespace-nowrap", className)}>
			{children}
		</span>
	);
}

const inputBase =
	"min-h-11 w-full rounded-xl border bg-background px-3.5 text-[15px] text-foreground aria-[invalid=true]:border-destructive";

/** Label + control + error linked through aria-describedby. */
export function Field({
	label,
	error,
	hint,
	as = "input",
	options,
	...p
}: {
	label: string;
	error?: string;
	hint?: string;
	as?: "input" | "textarea" | "select";
	options?: { value: string; label: string }[];
} & InputHTMLAttributes<HTMLInputElement> &
	TextareaHTMLAttributes<HTMLTextAreaElement> &
	SelectHTMLAttributes<HTMLSelectElement>) {
	const id = useId();
	const common = {
		id,
		"aria-invalid": error ? true : undefined,
		"aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined,
		className: cx(
			inputBase,
			error ? "border-destructive" : "border-border",
			as === "textarea" && "py-3",
		),
	};
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{as === "textarea" ? (
				<textarea
					{...(p as TextareaHTMLAttributes<HTMLTextAreaElement>)}
					{...common}
				/>
			) : as === "select" ? (
				<select {...(p as SelectHTMLAttributes<HTMLSelectElement>)} {...common}>
					{options?.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			) : (
				<input {...(p as InputHTMLAttributes<HTMLInputElement>)} {...common} />
			)}
			{error ? (
				<span id={`${id}-err`} className="text-[13px] text-destructive-fg">
					{error}
				</span>
			) : hint ? (
				<span id={`${id}-hint`} className="text-[13px] text-muted">
					{hint}
				</span>
			) : null}
		</div>
	);
}

export function ProgressBar({
	value,
	label,
}: {
	value: number;
	label: string;
}) {
	return (
		<div
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={value}
			aria-label={label}
			className="h-1.5 overflow-hidden rounded-full bg-card-muted"
		>
			<div
				className="h-full rounded-full bg-primary"
				style={{ width: `${value}%` }}
			/>
		</div>
	);
}

const ToastCtx = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState("");
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const show = useCallback((m: string) => {
		setMessage(m);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setMessage(""), 4000);
	}, []);
	return (
		<ToastCtx.Provider value={show}>
			{children}
			<div
				role="status"
				aria-live="polite"
				className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex justify-end sm:left-auto"
			>
				{message && (
					<div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-2xl">
						<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M5 12.5l4.5 4.5L19 7.5"
								fill="none"
								stroke="var(--success)"
								strokeWidth="2.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<span className="text-[15px] font-medium">{message}</span>
					</div>
				)}
			</div>
		</ToastCtx.Provider>
	);
}

const initials = (title: string) =>
	title
		.split(/\s+/)
		.filter((w) => w.length > 2 || title.split(/\s+/).length < 2)
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase() || "TF";

/** Stable 20-40 dot ornament per course id. */
function ornament(id: string) {
	let h = 0;
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	return `0 ${(333 / (20 + (h % 21))).toFixed(2)}`;
}

export function Medallion({
	id,
	title,
	size = 104,
}: {
	id: string;
	title: string;
	size?: number;
}) {
	return (
		<svg width={size} height={size} viewBox="0 0 132 132" aria-hidden="true">
			<circle
				cx="66"
				cy="66"
				r="62"
				fill="oklch(0.23 0.006 75)"
				stroke="var(--silver)"
				strokeWidth="1.5"
			/>
			<circle
				cx="66"
				cy="66"
				r="53"
				fill="none"
				stroke="var(--silver)"
				strokeWidth="3"
				strokeLinecap="round"
				strokeDasharray={ornament(id)}
			/>
			<circle
				cx="66"
				cy="66"
				r="44"
				fill="none"
				stroke="oklch(0.55 0.008 80)"
				strokeWidth="1"
			/>
			<text
				x="66"
				y="78"
				textAnchor="middle"
				fill="oklch(0.9 0.008 85)"
				style={{
					fontFamily: "var(--font-display)",
					fontWeight: 800,
					fontSize: 34,
					letterSpacing: "-0.02em",
				}}
			>
				{initials(title)}
			</text>
		</svg>
	);
}

/** 16:9 cover: the course image, or the medallion on the hatched background. */
export function Cover({
	id,
	title,
	coverUrl,
	size = 104,
	className,
}: {
	id: string;
	title: string;
	coverUrl: string | null;
	size?: number;
	className?: string;
}) {
	return (
		<div
			className={cx(
				"relative flex aspect-video items-center justify-center overflow-hidden border border-border",
				!coverUrl && "cover-bg",
				className,
			)}
		>
			{coverUrl ? (
				// biome-ignore lint/performance/noImgElement: creator-supplied external URLs
				<img src={coverUrl} alt="" className="h-full w-full object-cover" />
			) : (
				<Medallion id={id} title={title} size={size} />
			)}
		</div>
	);
}

export const Logo = ({ size = 40 }: { size?: number }) => (
	<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
		<circle
			cx="20"
			cy="20"
			r="19"
			fill="oklch(0.26 0.006 75)"
			stroke="var(--silver)"
			strokeWidth="1.5"
		/>
		<circle
			cx="20"
			cy="20"
			r="15.5"
			fill="none"
			stroke="var(--silver)"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeDasharray="0 4.87"
		/>
		<text
			x="20"
			y="24.5"
			textAnchor="middle"
			fill="oklch(0.93 0.006 85)"
			style={{
				fontFamily: "var(--font-display)",
				fontWeight: 800,
				fontSize: 12,
			}}
		>
			TF
		</text>
	</svg>
);
