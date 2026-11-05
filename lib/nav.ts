/** Same-origin relative path only; anything else falls back to the catalog (no open redirects). */
export function safeNext(next: string | null | undefined): string {
	return next && /^\/(?![/\\])/.test(next) ? next : "/";
}

export const signInUrl = (path: string) =>
	`/sign-in?next=${encodeURIComponent(path)}`;
