// In-memory stand-in for the real API, for local testing: `npm run mock`.
// Listens where API_URL points by default (http://localhost:4000), so the app
// needs no change. State resets on restart. You start signed in as an admin.
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

// The course page only accepts UUID-shaped course ids.
const [C1, C2, C3] = [1, 2, 3].map(
	(n) => `00000000-0000-4000-8000-00000000000${n}`,
);

type Row = Record<string, any>;
const now = Date.now();
const iso = (days: number) => new Date(now + days * 864e5).toISOString();
let seq = 100;
const newId = (p: string) => `${p}${++seq}`;
const img = (seed: string, w = 800, h = 450) =>
	`https://picsum.photos/seed/${seed}/${w}/${h}`;
const YT = "dQw4w9WgXcQ";

let signedIn = true;
const me: Row = {
	id: "u1",
	email: "ana@example.com",
	username: "ana",
	bio: "Ilustradora e professora de desenho.",
	role: "admin",
	emailVerified: true,
	avatarUrl: null,
	socialLinks: [{ kind: "instagram", url: "https://instagram.com/ana" }],
};
const users: Row[] = [
	{ ...me, suspendedAt: null, createdAt: iso(-200) },
	{
		id: "u2",
		email: "bruno@example.com",
		username: "bruno",
		role: "creator",
		suspendedAt: null,
		createdAt: iso(-90),
	},
	{
		id: "u3",
		email: "carla@example.com",
		username: "carla",
		role: "user",
		suspendedAt: null,
		createdAt: iso(-30),
	},
	{
		id: "u4",
		email: "davi@example.com",
		username: "davi",
		role: "user",
		suspendedAt: iso(-2),
		createdAt: iso(-10),
	},
];
const tags: Row[] = [
	{ id: "t1", slug: "desenho", name: "Desenho" },
	{ id: "t2", slug: "pintura-digital", name: "Pintura digital" },
	{ id: "t3", slug: "anatomia", name: "Anatomia" },
];
const owner = () => ({
	username: me.username,
	bio: me.bio,
	avatarUrl: me.avatarUrl,
});
const course = (
	id: string,
	title: string,
	cents: number,
	featured: boolean,
	tagIdx: number[],
): Row => ({
	id,
	ownerId: "u1",
	title,
	description: `Tudo o que você precisa para dominar ${title.toLowerCase()}, do zero ao portfólio.`,
	coverUrl: img(id),
	baseMonthlyCents: cents,
	paymentType: "subscription",
	published: true,
	featured,
	tags: tagIdx.map((i) => tags[i]),
});
const courses: Row[] = [
	course(C1, "Fundamentos do Desenho", 4990, true, [0]),
	course(C2, "Pintura Digital na Prática", 6990, true, [1]),
	course(C3, "Anatomia para Artistas", 5990, false, [0, 2]),
];
const plans: Row[] = courses.flatMap((c) => [
	{
		id: `${c.id}p1`,
		courseId: c.id,
		months: 1,
		discountPercent: 0,
		lifetimeCents: null,
	},
	{
		id: `${c.id}p2`,
		courseId: c.id,
		months: 12,
		discountPercent: 20,
		lifetimeCents: null,
	},
	{
		id: `${c.id}p3`,
		courseId: c.id,
		months: null,
		discountPercent: 0,
		lifetimeCents: 49900,
	},
]);
const pages: Row[] = courses.flatMap((c) =>
	[
		["m1", null, "Módulo 1: Primeiros passos"],
		["a1", "m1", "Boas-vindas"],
		["a2", "m1", "Materiais"],
		["m2", null, "Módulo 2: Prática"],
		["a3", "m2", "Exercício guiado"],
	].map(([k, parent, title], position) => ({
		id: `${c.id}${k}`,
		courseId: c.id,
		parentId: parent && `${c.id}${parent}`,
		title,
		slug: k,
		position,
	})),
);
const blocks: Row[] = [
	...courses.flatMap((c) => [
		{
			type: "title",
			config: { text: `Aprenda ${c.title}` },
			pageId: null,
			courseId: c.id,
		},
		{
			type: "text",
			config: {
				markdown:
					"Aulas **diretas ao ponto**, com exercícios e feedback.\n\n- Vídeo-aulas\n- Material de apoio",
			},
			pageId: null,
			courseId: c.id,
		},
		{
			type: "image",
			config: { url: img(`${c.id}-sell`), alt: "Exemplo de trabalho" },
			pageId: null,
			courseId: c.id,
		},
	]),
	...pages.flatMap((p) => [
		{
			type: "text",
			config: { markdown: `Conteúdo de **${p.title}**. Texto de exemplo.` },
			pageId: p.id,
			courseId: p.courseId,
		},
		{
			type: "video",
			config: { youtubeId: YT },
			pageId: p.id,
			courseId: p.courseId,
		},
		{
			type: "url",
			config: { url: "https://example.com", label: "Material de apoio" },
			pageId: p.id,
			courseId: p.courseId,
		},
	]),
].map((b, position) => ({ id: `b${position}`, position, ...b }));
const coupons: Row[] = [
	{
		id: "k1",
		courseId: C1,
		code: "BEMVINDO",
		type: "percent",
		value: "10",
		expiresAt: iso(30),
		canceledAt: null,
	},
];
const done = new Set<string>([`${C1}a1`]);
const feedback: Row[] = [
	{
		id: "f1",
		courseId: C1,
		userId: "u3",
		text: "Curso excelente, didática ótima!",
		createdAt: iso(-5),
		author: { username: "carla" },
	},
	{
		id: "f2",
		courseId: C1,
		userId: "u4",
		text: "Aprendi muito em pouco tempo.",
		createdAt: iso(-3),
		author: { username: "davi" },
	},
];
const comments: Row[] = [
	{
		id: "m1",
		pageId: `${C1}a1`,
		body: "Ótima aula!",
		createdAt: iso(-2),
		deleted: false,
		author: { username: "carla", role: "user" },
		replies: [
			{
				id: "m2",
				body: "Que bom que gostou!",
				createdAt: iso(-1),
				deleted: false,
				author: { username: "ana", role: "admin" },
			},
		],
	},
];
const episodes: Row[] = [1, 2, 3, 4, 5].map((n) => ({
	videoId: `episode${String(n).padStart(4, "0")}`, // 11 chars, like a YouTube id
	title: `Episódio ${n}: conversa sobre arte`,
	publishedAt: iso(-7 * n),
	thumbnailUrl: img(`ep${n}`, 480, 270),
	description: `Neste episódio falamos sobre carreira e processo criativo.\nLinks: https://example.com/ep${n}`,
	participants: [
		{ userId: "u1", username: "ana", name: "ana" },
		{ name: "Convidado Especial" },
	],
}));
const charge = (id: string, status: string, months: number | null): Row => ({
	id,
	amountCents: 4990,
	status,
	months,
	url: "https://example.com/pagamento",
	dueAt: iso(3),
	paidAt: status === "pending" ? null : iso(-20),
	refundedAt: status === "refunded" ? iso(-1) : null,
	createdAt: iso(-21),
});
const subscriptions: Row[] = [
	{
		id: "s1",
		course: { id: C1, title: courses[0].title },
		expiresAt: iso(5),
		canceledAt: null,
		warning: "expiring",
		charges: [charge("ch1", "paid", 1), charge("ch2", "pending", 1)],
	},
	{
		id: "s2",
		course: { id: C2, title: courses[1].title },
		expiresAt: null,
		canceledAt: null,
		warning: null,
		charges: [charge("ch3", "paid", null)],
	},
];
const sales: Row[] = [
	{
		id: "ch10",
		courseId: C1,
		courseTitle: courses[0].title,
		amountCents: 4990,
		netCents: 4491,
		status: "paid",
		paidAt: iso(-4),
		refundedAt: null,
	},
	{
		id: "ch11",
		courseId: C2,
		courseTitle: courses[1].title,
		amountCents: 67104,
		netCents: 60394,
		status: "paid",
		paidAt: iso(-9),
		refundedAt: null,
	},
	{
		id: "ch12",
		courseId: C1,
		courseTitle: courses[0].title,
		amountCents: 4990,
		netCents: null,
		status: "refunded",
		paidAt: iso(-12),
		refundedAt: iso(-11),
	},
];
let payout = "enabled";

class Fail extends Error {
	status: number;
	constructor(status: number, code: string) {
		super(code);
		this.status = status;
	}
}
const find = (list: Row[], id: string, key = "id") => {
	const row = list.find((r) => r[key] === id);
	if (!row) throw new Fail(404, "not_found");
	return row;
};
const remove = (list: Row[], id: string) => {
	list.splice(list.indexOf(find(list, id)), 1);
};
const fullCourse = (c: Row) => ({ ...c, owner: owner() });
const card = (c: Row) => ({
	id: c.id,
	title: c.title,
	coverUrl: c.coverUrl,
	creator: me.username,
	featured: c.featured,
	startingPriceCents: c.baseMonthlyCents,
	tags: c.tags,
});
const priced = (p: Row) => ({
	...p,
	priceCents:
		p.lifetimeCents ??
		Math.round(
			find(courses, p.courseId).baseMonthlyCents *
				p.months *
				(1 - p.discountPercent / 100),
		),
});
/** Depth-first, siblings by position: the order the lesson sidebar expects. */
const tree = (courseId: string, parentId: string | null = null): Row[] =>
	pages
		.filter((p) => p.courseId === courseId && p.parentId === parentId)
		.sort((a, b) => a.position - b.position)
		.flatMap((p) => [p, ...tree(courseId, p.id)]);
const blocksOf = (courseId: string, pageId: string | null) =>
	blocks
		.filter((b) => b.courseId === courseId && b.pageId === pageId)
		.sort((a, b) => a.position - b.position);
const progress = (courseId: string) => {
	const ids = tree(courseId).map((p) => p.id);
	const completedPageIds = ids.filter((id) => done.has(id));
	return {
		completedPageIds,
		total: ids.length,
		percent: ids.length
			? Math.round((completedPageIds.length / ids.length) * 100)
			: 0,
	};
};
const startCharge = () => ({
	chargeId: newId("ch"),
	amountCents: 4990,
	url: "https://example.com/pagamento",
});

type Ctx = { p: string[]; body: any; query: URLSearchParams };
const routes: [string, RegExp, (c: Ctx) => unknown][] = [
	["GET", /^\/auth\/me$/, () => me],
	["PATCH", /^\/auth\/me$/, ({ body }) => Object.assign(me, body)],
	[
		"POST",
		/^\/auth\/(sign-in|sign-up)$/,
		() => {
			signedIn = true;
		},
	],
	[
		"POST",
		/^\/auth\/sign-out$/,
		() => {
			signedIn = false;
		},
	],

	[
		"GET",
		/^\/catalog$/,
		({ query }) => {
			const tag = query.get("tag");
			const list = courses
				.filter(
					(c) =>
						c.published && (!tag || c.tags.some((t: Row) => t.slug === tag)),
				)
				.map(card);
			return { featured: list.filter((c) => c.featured), courses: list };
		},
	],
	["GET", /^\/tags$/, () => tags],
	[
		"POST",
		/^\/admin\/tags$/,
		({ body }) => {
			const tag = {
				id: newId("t"),
				slug: body.name.toLowerCase().replace(/\s+/g, "-"),
				name: body.name,
			};
			tags.push(tag);
			return tag;
		},
	],
	[
		"PATCH",
		/^\/admin\/tags\/([^/]+)$/,
		({ p, body }) => Object.assign(find(tags, p[0]), body),
	],
	["DELETE", /^\/admin\/tags\/([^/]+)$/, ({ p }) => remove(tags, p[0])],
	[
		"GET",
		/^\/creators\/([^/]+)$/,
		({ p }) => {
			if (decodeURIComponent(p[0]) !== me.username)
				throw new Fail(404, "not_found");
			return {
				...owner(),
				socialLinks: me.socialLinks,
				courses: courses.filter((c) => c.published).map(card),
			};
		},
	],

	[
		"GET",
		/^\/content\/([^/]+)\/selling$/,
		({ p }) => ({
			course: fullCourse(find(courses, p[0])),
			blocks: blocksOf(p[0], null),
			plans: plans.filter((x) => x.courseId === p[0]).map(priced),
			outline: tree(p[0]),
		}),
	],
	["GET", /^\/content\/([^/]+)\/pages$/, ({ p }) => tree(p[0])],
	[
		"GET",
		/^\/content\/([^/]+)\/pages\/([^/]+)$/,
		({ p }) => {
			const order = tree(p[0]);
			const i = order.indexOf(find(order, p[1]));
			return {
				page: order[i],
				blocks: blocksOf(p[0], p[1]),
				prevId: order[i - 1]?.id ?? null,
				nextId: order[i + 1]?.id ?? null,
			};
		},
	],
	["GET", /^\/content\/([^/]+)\/progress$/, ({ p }) => progress(p[0])],
	[
		"PUT",
		/^\/content\/([^/]+)\/pages\/([^/]+)\/complete$/,
		({ p }) => {
			done.add(p[1]);
			return progress(p[0]);
		},
	],
	[
		"DELETE",
		/^\/content\/([^/]+)\/pages\/([^/]+)\/complete$/,
		({ p }) => {
			done.delete(p[1]);
			return progress(p[0]);
		},
	],
	// The player is an iframe, so any embeddable URL works.
	[
		"GET",
		/^\/content\/[^/]+\/videos\/[^/]+\/playback$/,
		() => ({
			url: `https://www.youtube-nocookie.com/embed/${YT}`,
			expiresAt: iso(1),
		}),
	],

	[
		"GET",
		/^\/content\/([^/]+)\/feedback$/,
		({ p }) => {
			const items = feedback.filter((f) => f.courseId === p[0]);
			return { items, count: items.length };
		},
	],
	[
		"GET",
		/^\/content\/([^/]+)\/feedback\/mine$/,
		({ p }) =>
			find(
				feedback.filter((f) => f.courseId === p[0]),
				me.id,
				"userId",
			),
	],
	[
		"POST",
		/^\/content\/([^/]+)\/feedback$/,
		({ p, body }) => {
			const f = {
				id: newId("f"),
				courseId: p[0],
				userId: me.id,
				text: body.text,
				createdAt: iso(0),
				author: { username: me.username },
			};
			feedback.push(f);
			return f;
		},
	],
	[
		"POST",
		/^\/courses\/[^/]+\/feedback\/([^/]+)\/hide$/,
		({ p }) => remove(feedback, p[0]),
	],

	[
		"GET",
		/^\/content\/[^/]+\/pages\/([^/]+)\/comments$/,
		({ p }) => ({
			items: comments.filter((c) => c.pageId === p[0]),
			nextCursor: null,
		}),
	],
	[
		"POST",
		/^\/content\/[^/]+\/pages\/([^/]+)\/comments$/,
		({ p, body }) => {
			const c: Row = {
				id: newId("m"),
				body: body.body,
				createdAt: iso(0),
				deleted: false,
				author: { username: me.username, role: me.role },
			};
			const top = comments.find(
				(t) =>
					t.id === body.parentId ||
					t.replies.some((r: Row) => r.id === body.parentId),
			);
			if (top) top.replies.push(c);
			else comments.push({ ...c, pageId: p[0], replies: [] });
			return c;
		},
	],
	[
		"DELETE",
		/^\/content\/[^/]+\/comments\/([^/]+)$/,
		({ p }) => {
			const top = comments.find((c) => c.id === p[0]);
			if (top?.replies.length) Object.assign(top, { body: "", deleted: true });
			else if (top) remove(comments, p[0]);
			else
				for (const c of comments)
					c.replies = c.replies.filter((r: Row) => r.id !== p[0]);
		},
	],

	[
		"GET",
		/^\/courses\/mine$/,
		() =>
			courses.map((c) => ({
				...fullCourse(c),
				_count: {
					plans: plans.filter((x) => x.courseId === c.id).length,
					pages: pages.filter((x) => x.courseId === c.id).length,
					blocks: blocksOf(c.id, null).length,
				},
			})),
	],
	[
		"POST",
		/^\/courses$/,
		({ body }) => {
			const c = {
				id: randomUUID(),
				ownerId: me.id,
				coverUrl: null,
				published: false,
				featured: false,
				tags: [],
				...body,
			};
			courses.push(c);
			return fullCourse(c);
		},
	],
	["GET", /^\/courses\/([^/]+)$/, ({ p }) => fullCourse(find(courses, p[0]))],
	[
		"PATCH",
		/^\/courses\/([^/]+)$/,
		({ p, body }) => {
			const { tagSlugs, ...rest } = body;
			const c = Object.assign(find(courses, p[0]), rest);
			if (tagSlugs) c.tags = tags.filter((t) => tagSlugs.includes(t.slug));
			return fullCourse(c);
		},
	],

	[
		"GET",
		/^\/courses\/([^/]+)\/plans$/,
		({ p }) => plans.filter((x) => x.courseId === p[0]).map(priced),
	],
	[
		"POST",
		/^\/courses\/([^/]+)\/plans$/,
		({ p, body }) => {
			const plan = {
				id: newId("p"),
				courseId: p[0],
				months: null,
				discountPercent: 0,
				lifetimeCents: null,
				...body,
			};
			plans.push(plan);
			return priced(plan);
		},
	],
	[
		"PATCH",
		/^\/courses\/[^/]+\/plans\/([^/]+)$/,
		({ p, body }) => priced(Object.assign(find(plans, p[0]), body)),
	],
	[
		"DELETE",
		/^\/courses\/[^/]+\/plans\/([^/]+)$/,
		({ p }) => remove(plans, p[0]),
	],

	[
		"GET",
		/^\/courses\/([^/]+)\/coupons$/,
		({ p }) => coupons.filter((x) => x.courseId === p[0]),
	],
	[
		"POST",
		/^\/courses\/([^/]+)\/coupons$/,
		({ p, body }) => {
			const k = {
				id: newId("k"),
				courseId: p[0],
				canceledAt: null,
				...body,
				value: String(body.value),
			};
			coupons.push(k);
			return k;
		},
	],
	[
		"POST",
		/^\/courses\/[^/]+\/coupons\/([^/]+)\/cancel$/,
		({ p }) => {
			find(coupons, p[0]).canceledAt = iso(0);
		},
	],

	[
		"GET",
		/^\/courses\/([^/]+)\/pages$/,
		({ p }) => pages.filter((x) => x.courseId === p[0]),
	],
	[
		"POST",
		/^\/courses\/([^/]+)\/pages$/,
		({ p, body }) => {
			const id = newId("a");
			const page = {
				id,
				courseId: p[0],
				parentId: null,
				slug: id,
				position: pages.length,
				...body,
			};
			pages.push(page);
			return page;
		},
	],
	[
		"PATCH",
		/^\/courses\/[^/]+\/pages\/([^/]+)$/,
		({ p, body }) => Object.assign(find(pages, p[0]), body),
	],
	[
		"DELETE",
		/^\/courses\/[^/]+\/pages\/([^/]+)$/,
		({ p }) => remove(pages, p[0]),
	],

	// Blocks of a lesson (`/pages/:pageId/blocks`) or of the selling page (`/blocks`).
	[
		"GET",
		/^\/courses\/([^/]+)(?:\/pages\/([^/]+))?\/blocks$/,
		({ p }) => blocksOf(p[0], p[1] ?? null),
	],
	[
		"POST",
		/^\/courses\/([^/]+)(?:\/pages\/([^/]+))?\/blocks$/,
		({ p, body }) => {
			const b = {
				id: newId("b"),
				courseId: p[0],
				pageId: p[1] ?? null,
				position: blocks.length,
				...body,
			};
			blocks.push(b);
			return b;
		},
	],
	[
		"PATCH",
		/^\/courses\/[^/]+(?:\/pages\/[^/]+)?\/blocks\/([^/]+)$/,
		({ p, body }) => Object.assign(find(blocks, p[0]), body),
	],
	[
		"DELETE",
		/^\/courses\/[^/]+(?:\/pages\/[^/]+)?\/blocks\/([^/]+)$/,
		({ p }) => remove(blocks, p[0]),
	],

	// No upload host in the mock: the tus upload itself will fail.
	[
		"POST",
		/^\/courses\/[^/]+\/videos$/,
		() => ({
			videoId: newId("v"),
			upload: { url: "http://localhost:4000/upload", headers: {} },
		}),
	],
	[
		"GET",
		/^\/courses\/[^/]+\/videos\/([^/]+)$/,
		({ p }) => ({ id: p[0], status: "ready" }),
	],

	["POST", /^\/courses\/[^/]+\/(purchase|renew)$/, startCharge],
	["GET", /^\/subscriptions$/, () => subscriptions],
	[
		"POST",
		/^\/subscriptions\/([^/]+)\/cancel$/,
		({ p }) => {
			find(subscriptions, p[0]).canceledAt = iso(0);
		},
	],
	[
		"POST",
		/^\/payouts$/,
		() => {
			payout = "enabled";
			return { status: payout };
		},
	],
	["GET", /^\/payouts\/status$/, () => ({ status: payout })],
	[
		"GET",
		/^\/dashboard\/income$/,
		({ query }) => {
			const id = query.get("courseId");
			const charges = sales.filter((s) => !id || s.courseId === id);
			const sum = (list: Row[], key: string) =>
				list.reduce((n, s) => n + (s[key] ?? 0), 0);
			const refunds = charges.filter((s) => s.status === "refunded");
			return {
				salesCount: charges.length,
				salesCents: sum(charges, "amountCents"),
				refundsCount: refunds.length,
				refundsCents: sum(refunds, "amountCents"),
				receivedCents: sum(charges, "netCents"),
				charges,
			};
		},
	],
	[
		"GET",
		/^\/dashboard\/subscribers$/,
		() => [
			{
				subscriptionId: "s10",
				courseId: C1,
				courseTitle: courses[0].title,
				user: { id: "u3", username: "carla", email: "carla@example.com" },
				planMonths: 12,
				expiresAt: iso(200),
				canceledAt: null,
				percent: 40,
			},
			{
				subscriptionId: "s11",
				courseId: C2,
				courseTitle: courses[1].title,
				user: { id: "u4", username: "davi", email: "davi@example.com" },
				planMonths: null,
				expiresAt: null,
				canceledAt: null,
				percent: 100,
			},
		],
	],
	[
		"POST",
		/^\/charges\/([^/]+)\/refund$/,
		({ p }) => {
			Object.assign(find(sales, p[0]), {
				status: "refunded",
				refundedAt: iso(0),
				netCents: null,
			});
		},
	],

	[
		"GET",
		/^\/admin\/users$/,
		({ query }) => {
			const q = (query.get("q") ?? "").toLowerCase();
			const role = query.get("role");
			return users.filter(
				(u) =>
					(u.username.includes(q) || u.email.includes(q)) &&
					(!role || u.role === role),
			);
		},
	],
	[
		"PUT",
		/^\/admin\/users\/([^/]+)\/role$/,
		({ p, body }) => {
			find(users, p[0]).role = body.role;
		},
	],
	[
		"POST",
		/^\/admin\/users\/([^/]+)\/suspend$/,
		({ p }) => {
			find(users, p[0]).suspendedAt = iso(0);
		},
	],
	[
		"POST",
		/^\/admin\/users\/([^/]+)\/restore$/,
		({ p }) => {
			find(users, p[0]).suspendedAt = null;
		},
	],

	[
		"GET",
		/^\/podcast\/episodes$/,
		() => ({
			items: episodes.map(({ description: _, ...e }) => e),
			nextCursor: null,
		}),
	],
	[
		"GET",
		/^\/podcast\/episodes\/([^/]+)$/,
		({ p }) => find(episodes, p[0], "videoId"),
	],
	[
		"POST",
		/^\/admin\/podcast\/sync$/,
		() => ({ created: 0, updated: episodes.length, removed: 0 }),
	],
	[
		"PUT",
		/^\/admin\/podcast\/episodes\/([^/]+)\/participants$/,
		({ p, body }) => {
			find(episodes, p[0], "videoId").participants = body.map((x: Row) =>
				x.userId
					? {
							userId: x.userId,
							username: find(users, x.userId).username,
							name: find(users, x.userId).username,
						}
					: x,
			);
		},
	],
];

// Endpoints a visitor may call; everything else answers 401 when signed out.
const PUBLIC =
	/^\/(auth\/(?!me$)|catalog$|tags$|creators\/|podcast\/|content\/[^/]+\/(selling|feedback)$)/;

createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", "http://localhost");
	const send = (status: number, data: unknown) => {
		res.writeHead(status, { "content-type": "application/json" });
		res.end(JSON.stringify(data ?? {}));
	};
	try {
		let raw = "";
		for await (const chunk of req) raw += chunk;
		if (!signedIn && !PUBLIC.test(url.pathname))
			throw new Fail(401, "unauthenticated");
		for (const [method, pattern, handler] of routes) {
			const m = req.method === method && url.pathname.match(pattern);
			if (m) {
				return send(
					200,
					await handler({
						p: m.slice(1),
						body: raw ? JSON.parse(raw) : {},
						query: url.searchParams,
					}),
				);
			}
		}
		// Unmocked writes (password reset, email verification...) just succeed.
		if (req.method !== "GET") return send(200, {});
		throw new Fail(404, "not_found");
	} catch (e) {
		const status = e instanceof Fail ? e.status : 500;
		if (status === 500) console.error(req.method, url.pathname, e);
		send(status, { error: e instanceof Fail ? e.message : "unknown" });
	}
}).listen(4000, () => console.log("mock API on http://localhost:4000"));
