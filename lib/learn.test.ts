import assert from "node:assert/strict";
import { test } from "node:test";
import {
	defaultPlan,
	outlineCounts,
	outlineSummary,
	resumePage,
} from "./learn.ts";

const pages = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("resumePage opens the page after the last completed one", () => {
	assert.equal(resumePage(pages, [])?.id, "a");
	assert.equal(resumePage(pages, ["a"])?.id, "b");
	assert.equal(resumePage(pages, ["a", "c"])?.id, "c");
	assert.equal(resumePage([], []), undefined);
});

test("defaultPlan picks the longest recurring plan", () => {
	const plans = [
		{ months: null },
		{ months: 1 },
		{ months: 12 },
		{ months: 6 },
	];
	assert.equal(defaultPlan(plans)?.months, 12);
	assert.equal(defaultPlan([{ months: null }])?.months, null);
});

const node = (id: string, parentId: string | null = null) => ({ id, parentId });
const summary = (o: { id: string; parentId: string | null }[]) => {
	const { lessons, modules } = outlineCounts(o);
	return outlineSummary(lessons, modules);
};

test("outlineCounts counts leaf lessons per group, at any depth", () => {
	const nested = [
		node("m1"),
		node("a1", "m1"),
		node("s1", "m1"),
		node("a2", "s1"),
		node("a3", "s1"),
		node("m2"),
		node("a4", "m2"),
		node("solta"),
	];
	const { leaves, lessons, modules } = outlineCounts(nested);
	assert.deepEqual(Object.fromEntries(leaves), { m1: 3, s1: 2, m2: 1 });
	assert.equal(lessons, 5);
	assert.equal(modules, 2);
	assert.equal(summary(nested), "5 aulas, 2 módulos");
});

test("outline summary handles flat, empty and singular outlines", () => {
	assert.equal(summary([node("a"), node("b")]), "2 aulas");
	assert.equal(summary([]), "0 aulas");
	assert.equal(summary([node("m"), node("a", "m")]), "1 aula, 1 módulo");
	const twelve = ["m1", "m2", "m3"].flatMap((m) => [
		node(m),
		...[1, 2, 3, 4].map((i) => node(`${m}-${i}`, m)),
	]);
	assert.equal(summary(twelve), "12 aulas, 3 módulos");
});
