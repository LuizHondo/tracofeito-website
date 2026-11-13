import assert from "node:assert/strict";
import { test } from "node:test";
import { calls, errorMessage } from "./api.ts";

test("the API's invalid_block rejection reaches the user in pt-BR", async () => {
	globalThis.fetch = async () =>
		Response.json({ error: "invalid_block" }, { status: 400 });
	const e = await calls.createBlock("c", null, {}).catch((e) => e);
	assert.equal(
		errorMessage(e),
		"Confira os campos do bloco. Algum valor não é válido.",
	);
});
