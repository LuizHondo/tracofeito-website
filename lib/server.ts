const base = process.env.API_URL ?? "http://localhost:4000";

/** Server-component fetch straight to the API (public endpoints only). Null on 404. */
export async function serverApi<T>(path: string): Promise<T | null> {
	const res = await fetch(base + path, { cache: "no-store" });
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
	return (await res.json()) as T;
}
