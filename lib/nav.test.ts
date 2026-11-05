import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNext, signInUrl } from "./nav.ts";

test("safeNext keeps relative paths and drops everything else", () => {
	assert.equal(safeNext("/aprender/1/2"), "/aprender/1/2");
	assert.equal(safeNext("https://evil.com"), "/");
	assert.equal(safeNext("//evil.com"), "/");
	assert.equal(safeNext("/\\evil.com"), "/");
	assert.equal(safeNext(null), "/");
	assert.equal(
		safeNext(signInUrl("/estudio?a=1").split("next=")[1] ?? ""),
		"/",
	);
	assert.equal(
		safeNext(
			decodeURIComponent(signInUrl("/estudio?a=1").split("next=")[1] ?? ""),
		),
		"/estudio?a=1",
	);
});
