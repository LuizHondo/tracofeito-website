import type { Comment } from "./api.ts";

/** Appends `reply` to the thread that holds `parentId`: the top-level comment itself or one of its replies. */
export function addReply(
	list: Comment[],
	parentId: string,
	reply: Comment,
): Comment[] {
	return list.map((c) =>
		c.id === parentId || c.replies?.some((r) => r.id === parentId)
			? { ...c, replies: [...(c.replies ?? []), reply] }
			: c,
	);
}

/**
 * Removes a comment the way the API lists it afterwards: a top-level comment
 * with replies stays as a "removed" placeholder; anything else disappears, and
 * so does a placeholder left without replies.
 */
export function removeComment(list: Comment[], id: string): Comment[] {
	return list
		.map((c) =>
			c.id === id
				? { ...c, body: "", deleted: true }
				: { ...c, replies: (c.replies ?? []).filter((r) => r.id !== id) },
		)
		.filter((c) => !c.deleted || (c.replies?.length ?? 0) > 0);
}

/** Swaps comment `id` (top-level or reply) for `next`, keeping a thread's replies. */
export function replaceComment(
	list: Comment[],
	id: string,
	next: Comment,
): Comment[] {
	return list.map((c) =>
		c.id === id
			? { ...next, replies: next.replies ?? c.replies ?? [] }
			: { ...c, replies: c.replies?.map((r) => (r.id === id ? next : r)) },
	);
}
