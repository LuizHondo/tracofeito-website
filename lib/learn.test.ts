import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlan, resumePage } from "./learn.ts";

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
