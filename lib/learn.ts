import type { Page, Plan } from "./api";

/** Page after the last completed one in tree order; the first page when nothing is done. */
export function resumePage<T extends { id: string }>(
	pages: T[],
	completedIds: string[],
): T | undefined {
	const done = new Set(completedIds);
	const last = pages.map((p) => done.has(p.id)).lastIndexOf(true);
	return pages[Math.min(last + 1, pages.length - 1)];
}

/** Depth of each page (0 = top level) for a tree-ordered list. */
export function withDepth(
	pages: Page[],
): (Page & { depth: number; hasChildren: boolean })[] {
	const byId = new Map(pages.map((p) => [p.id, p]));
	const parents = new Set(pages.map((p) => p.parentId));
	const depth = (p: Page): number => {
		const parent = p.parentId ? byId.get(p.parentId) : undefined;
		return parent ? 1 + depth(parent) : 0;
	};
	return pages.map((p) => ({
		...p,
		depth: depth(p),
		hasChildren: parents.has(p.id),
	}));
}

/** The plan to pre-select: the longest recurring one, else the first. */
export function defaultPlan<T extends Pick<Plan, "months">>(
	plans: T[],
): T | undefined {
	return (
		plans
			.filter((p) => p.months !== null)
			.sort((a, b) => (b.months ?? 0) - (a.months ?? 0))[0] ?? plans[0]
	);
}

/** Flat editor list (any order) into sidebar order: depth-first, siblings by position. */
export function treeOrder<T extends Pick<Page, "id" | "parentId" | "position">>(
	pages: T[],
): T[] {
	const out: T[] = [];
	const walk = (parentId: string | null) => {
		for (const p of pages
			.filter((x) => x.parentId === parentId)
			.sort((a, b) => a.position - b.position)) {
			out.push(p);
			walk(p.id);
		}
	};
	walk(null);
	return out;
}
