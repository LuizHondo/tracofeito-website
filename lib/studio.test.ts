import assert from "node:assert/strict";
import { test } from "node:test";
import { parseReais } from "./studio.ts";

test("parseReais accepts reais and rejects junk or negatives", () => {
	assert.equal(parseReais("49,90"), 4990);
	assert.equal(parseReais("R$ 1.234,5"), 123450);
	assert.equal(parseReais("0"), 0);
	assert.equal(parseReais("-5"), null);
	assert.equal(parseReais("abc"), null);
	assert.equal(parseReais(""), null);
});
