import type { StudioCourse } from "./api";

/** The seven setup steps behind "n de 7" (interpretation of the design, see design.md). */
export function readiness(c: StudioCourse) {
	const steps = [
		!!c.title,
		!!c.description,
		!!c.coverUrl,
		c.baseMonthlyCents > 0,
		c._count.plans > 0,
		c._count.blocks > 0,
		c._count.pages > 0,
	];
	return steps.filter(Boolean).length;
}

/** "R$ 49,90" or "49,90" text to cents; null when not a non-negative number. */
export function parseReais(input: string): number | null {
	const s = input
		.trim()
		.replace(/^R\$\s*/, "")
		.replace(/\./g, "")
		.replace(",", ".");
	if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
	return Math.round(Number(s) * 100);
}
