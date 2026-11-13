import assert from "node:assert/strict";
import { test } from "node:test";
import { linkify } from "./podcast.ts";

test("linkify turns http(s) URLs into links and leaves everything else as text", () => {
	assert.deepEqual(
		linkify("Veja https://ex.com/a?b=1. <script>alert(1)</script>"),
		[
			{ text: "Veja " },
			{ text: "https://ex.com/a?b=1", href: "https://ex.com/a?b=1" },
			{ text: "." },
			{ text: " <script>alert(1)</script>" },
		],
	);
	assert.deepEqual(linkify("javascript:alert(1) ftp://x"), [
		{ text: "javascript:alert(1) ftp://x" },
	]);
	assert.deepEqual(linkify(""), []);
});
