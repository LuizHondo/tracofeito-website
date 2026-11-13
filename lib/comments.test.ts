import assert from "node:assert/strict";
import { test } from "node:test";
import type { Comment } from "./api.ts";
import { addReply, removeComment, replaceComment } from "./comments.ts";

const c = (id: string, replies?: Comment[]): Comment => ({
	id,
	body: id,
	createdAt: "2026-11-01T00:00:00Z",
	deleted: false,
	author: { username: "bia", role: "user" },
	replies,
});
const shape = (list: Comment[]) =>
	list.map((x) => [
		x.deleted ? `(${x.id})` : x.id,
		...(x.replies ?? []).map((r) => r.id),
	]);
const threads = () => [c("a", [c("a1"), c("a2")]), c("b", [])];

test("a reply lands at the end of its thread", () => {
	assert.deepEqual(shape(addReply(threads(), "b", c("b1"))), [
		["a", "a1", "a2"],
		["b", "b1"],
	]);
});

test("a reply to a reply lands at the end of that reply's thread", () => {
	assert.deepEqual(shape(addReply(threads(), "a1", c("a3"))), [
		["a", "a1", "a2", "a3"],
		["b"],
	]);
});

test("deleting a comment with replies leaves a placeholder without its body", () => {
	const out = removeComment(threads(), "a");
	assert.deepEqual(shape(out), [["(a)", "a1", "a2"], ["b"]]);
	assert.equal(out[0]?.body, "");
});

test("deleting a comment without replies, or a reply, removes it", () => {
	assert.deepEqual(shape(removeComment(threads(), "b")), [["a", "a1", "a2"]]);
	assert.deepEqual(shape(removeComment(threads(), "a1")), [["a", "a2"], ["b"]]);
});

test("a placeholder disappears with its last reply", () => {
	const one = removeComment([c("a", [c("a1")])], "a");
	assert.deepEqual(shape(one), [["(a)", "a1"]]);
	assert.deepEqual(removeComment(one, "a1"), []);
});

test("replaceComment swaps an optimistic entry and keeps the thread", () => {
	assert.deepEqual(shape(replaceComment(threads(), "a2", c("real"))), [
		["a", "a1", "real"],
		["b"],
	]);
	assert.deepEqual(shape(replaceComment(threads(), "a", c("real"))), [
		["real", "a1", "a2"],
		["b"],
	]);
});
