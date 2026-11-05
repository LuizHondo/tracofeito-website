import type { BlockType } from "./shared/index.ts";

export type Role = "user" | "creator" | "admin";

export type Me = {
	id: string;
	email: string;
	username: string;
	bio: string;
	role: Role;
	emailVerified?: boolean;
};

export type CourseCard = {
	id: string;
	title: string;
	coverUrl: string | null;
	creator: string;
	featured: boolean;
	startingPriceCents: number;
};
export type Catalog = { featured: CourseCard[]; courses: CourseCard[] };

export type PaymentType = "subscription" | "one_time";

export type Course = {
	id: string;
	ownerId: string;
	title: string;
	description: string;
	coverUrl: string | null;
	baseMonthlyCents: number;
	paymentType: PaymentType;
	published: boolean;
	featured: boolean;
	owner: { username: string; bio: string };
};
/** `_count.blocks` counts only the selling page's blocks. */
export type StudioCourse = Course & {
	_count: { plans: number; pages: number; blocks: number };
};

export type Plan = {
	id: string;
	months: number | null;
	discountPercent: number;
	lifetimeCents: number | null;
	priceCents?: number;
};
export type Coupon = {
	id: string;
	code: string;
	type: "percent" | "fixed";
	value: string;
	expiresAt: string;
	canceledAt: string | null;
};
export type Block = {
	id: string;
	pageId: string | null;
	position: number;
	type: BlockType;
	config: Record<string, unknown>;
};
export type Page = {
	id: string;
	parentId: string | null;
	title: string;
	slug: string;
	position: number;
};
export type Selling = { course: Course; blocks: Block[]; plans: Plan[] };
export type PageContent = {
	page: Page;
	blocks: Block[];
	prevId: string | null;
	nextId: string | null;
};
export type Progress = {
	completedPageIds: string[];
	total: number;
	percent: number;
};
export type Video = { id: string; status: "processing" | "ready" | "failed" };
export type VideoUpload = {
	videoId: string;
	upload: { url: string; headers: Record<string, string> };
};
export type AdminUser = {
	id: string;
	email: string;
	username: string;
	role: Role;
	suspendedAt: string | null;
	createdAt: string;
};

export type Buyer = { name: string; cpfCnpj: string };
export type PayoutDetails = {
	name: string;
	cpfCnpj: string;
	mobilePhone: string;
	postalCode: string;
	addressNumber: string;
	birthDate?: string;
};
export type ChargeStart = {
	chargeId: string;
	amountCents: number;
	url: string;
};
export type MyCharge = {
	id: string;
	amountCents: number;
	status: "pending" | "expired" | "paid" | "refunded";
	months: number | null;
	url: string;
	dueAt: string;
	paidAt: string | null;
	refundedAt: string | null;
	createdAt: string;
};
export type MySubscription = {
	id: string;
	course: { id: string; title: string };
	expiresAt: string | null;
	canceledAt: string | null;
	warning: "expiring" | "expired" | null;
	charges: MyCharge[];
};
export type Income = {
	salesCount: number;
	salesCents: number;
	refundsCount: number;
	refundsCents: number;
	receivedCents: number;
	charges: {
		id: string;
		courseTitle: string;
		amountCents: number;
		netCents: number | null;
		status: "paid" | "refunded";
		paidAt: string | null;
		refundedAt: string | null;
	}[];
};
export type Subscriber = {
	subscriptionId: string;
	courseId: string;
	courseTitle: string;
	user: { id: string; username: string; email: string };
	planMonths: number | null;
	expiresAt: string | null;
	canceledAt: string | null;
	percent: number;
};
export type PayoutStatus = "none" | "pending" | "enabled";

export class ApiError extends Error {
	constructor(
		public status: number,
		public code: string,
	) {
		super(code);
	}
}

/** Typed fetch against the API proxy; throws ApiError with the API's error code. */
export async function api<T = void>(
	path: string,
	method = "GET",
	body?: unknown,
): Promise<T> {
	const res = await fetch(`/api${path}`, {
		method,
		credentials: "same-origin",
		headers: body ? { "content-type": "application/json" } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new ApiError(res.status, data.error ?? "unknown");
	}
	return (res.status === 204 ? undefined : await res.json()) as T;
}

/** The signed-in user, or null for a visitor. */
export const getMe = () =>
	api<Me>("/auth/me").catch((e) => {
		if (e instanceof ApiError && e.status === 401) return null;
		throw e;
	});

export const money = (cents: number) =>
	(cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const planLabel = (p: Pick<Plan, "months">) =>
	p.months === null
		? "Vitalício"
		: p.months === 1
			? "1 mês"
			: `${p.months} meses`;

const messages: Record<string, string> = {
	invalid_credentials: "Login ou senha incorretos",
	too_many_attempts: "Muitas tentativas. Tente novamente em alguns minutos.",
	email_taken: "Este email já está em uso.",
	username_taken: "Este nome de usuário já está em uso.",
	invalid_input: "Confira os campos e tente novamente.",
	invalid_or_expired_token:
		"Opa, esse link expirou. Peça outro para continuar.",
	email_not_verified: "Confirme seu email para continuar.",
	wrong_current_password: "A senha atual não confere.",
	plan_length_taken: "Já existe um plano com essa duração.",
	coupon_code_taken: "Esse código já está em uso neste curso.",
	already_expired: "A data de validade precisa estar no futuro.",
	invalid_block: "Confira os campos do bloco. Algum valor não é válido.",
	slug_taken: "Já existe uma aula com esse endereço neste nível.",
	invalid_parent: "Essa aula não pode ficar dentro dela mesma.",
	cannot_modify_self: "Você não pode alterar a própria conta",
	no_access: "Você precisa de um plano para ver este conteúdo.",
	forbidden: "Você não tem permissão para isso.",
	not_found: "Não encontramos o que você procura.",
	unauthenticated: "Entre na sua conta para continuar.",
	payouts_not_enabled:
		"Este curso ainda não pode receber pagamentos. Tente novamente mais tarde.",
	already_subscribed:
		"Você já tem uma assinatura deste curso. Renove em Minha conta.",
	invalid_coupon: "Esse cupom não é válido ou já expirou.",
	plan_not_found: "Esse plano não está mais disponível.",
	buyer_required: "Informe nome e CPF/CNPJ para gerar a cobrança.",
	not_renewable: "Esta assinatura não precisa de renovação.",
	payout_details_required:
		"Informe os dados para recebimento do primeiro curso.",
	payout_onboarding_failed:
		"Não conseguimos abrir sua conta de recebimento. Confira os dados e tente de novo.",
	refund_failed:
		"O estorno não foi aceito pelo meio de pagamento (boleto não pode ser estornado).",
	not_refundable: "Essa cobrança não pode ser estornada.",
};
export const errorMessage = (e: unknown) =>
	e instanceof ApiError
		? (messages[e.code] ?? "Algo deu errado. Tente de novo.")
		: "Algo deu errado. Tente de novo.";

/** Typed calls, one per endpoint the screens use. */
export const calls = {
	catalog: () => api<Catalog>("/catalog"),
	selling: (id: string) => api<Selling>(`/content/${id}/selling`),
	pages: (id: string) => api<Page[]>(`/content/${id}/pages`),
	page: (id: string, pageId: string) =>
		api<PageContent>(`/content/${id}/pages/${pageId}`),
	progress: (id: string) => api<Progress>(`/content/${id}/progress`),
	setComplete: (id: string, pageId: string, done: boolean) =>
		api<Progress>(
			`/content/${id}/pages/${pageId}/complete`,
			done ? "PUT" : "DELETE",
		),
	playback: (id: string, videoId: string) =>
		api<{ url: string; expiresAt: string }>(
			`/content/${id}/videos/${videoId}/playback`,
		),

	myCourses: () => api<StudioCourse[]>("/courses/mine"),
	course: (id: string) => api<Course>(`/courses/${id}`),
	createCourse: (body: unknown) => api<Course>("/courses", "POST", body),
	updateCourse: (id: string, body: unknown) =>
		api<Course>(`/courses/${id}`, "PATCH", body),

	plans: (id: string) => api<Plan[]>(`/courses/${id}/plans`),
	createPlan: (id: string, body: unknown) =>
		api<Plan>(`/courses/${id}/plans`, "POST", body),
	updatePlan: (id: string, planId: string, body: unknown) =>
		api<Plan>(`/courses/${id}/plans/${planId}`, "PATCH", body),
	deletePlan: (id: string, planId: string) =>
		api(`/courses/${id}/plans/${planId}`, "DELETE"),

	coupons: (id: string) => api<Coupon[]>(`/courses/${id}/coupons`),
	createCoupon: (id: string, body: unknown) =>
		api<Coupon>(`/courses/${id}/coupons`, "POST", body),
	cancelCoupon: (id: string, couponId: string) =>
		api(`/courses/${id}/coupons/${couponId}/cancel`, "POST"),

	editorPages: (id: string) => api<Page[]>(`/courses/${id}/pages`),
	createPage: (id: string, body: unknown) =>
		api<Page>(`/courses/${id}/pages`, "POST", body),
	updatePage: (id: string, pageId: string, body: unknown) =>
		api<Page>(`/courses/${id}/pages/${pageId}`, "PATCH", body),
	deletePage: (id: string, pageId: string) =>
		api(`/courses/${id}/pages/${pageId}`, "DELETE"),

	/** `pageId` null edits the selling page's blocks. */
	blocks: (id: string, pageId: string | null) =>
		api<Block[]>(blocksPath(id, pageId)),
	createBlock: (id: string, pageId: string | null, body: unknown) =>
		api<Block>(blocksPath(id, pageId), "POST", body),
	updateBlock: (
		id: string,
		pageId: string | null,
		blockId: string,
		body: unknown,
	) => api<Block>(`${blocksPath(id, pageId)}/${blockId}`, "PATCH", body),
	deleteBlock: (id: string, pageId: string | null, blockId: string) =>
		api(`${blocksPath(id, pageId)}/${blockId}`, "DELETE"),

	createVideo: (id: string, title: string) =>
		api<VideoUpload>(`/courses/${id}/videos`, "POST", { title }),
	video: (id: string, videoId: string) =>
		api<Video>(`/courses/${id}/videos/${videoId}`),

	purchase: (
		id: string,
		body: { planId: string; couponCode?: string; buyer: Buyer },
	) => api<ChargeStart>(`/courses/${id}/purchase`, "POST", body),
	renew: (id: string, body: { couponCode?: string; buyer?: Buyer }) =>
		api<ChargeStart>(`/courses/${id}/renew`, "POST", body),
	mySubscriptions: () => api<MySubscription[]>("/subscriptions"),
	cancelSubscription: (id: string) =>
		api(`/subscriptions/${id}/cancel`, "POST"),
	savePayout: (body: PayoutDetails) =>
		api<{ status: PayoutStatus }>("/payouts", "POST", body),
	payoutStatus: () => api<{ status: PayoutStatus }>("/payouts/status"),
	income: (query = "") => api<Income>(`/dashboard/income${query}`),
	subscribers: (query = "") =>
		api<Subscriber[]>(`/dashboard/subscribers${query}`),
	refund: (chargeId: string) => api(`/charges/${chargeId}/refund`, "POST"),

	adminUsers: (q: string, role: string) =>
		api<AdminUser[]>(
			`/admin/users?q=${encodeURIComponent(q)}${role ? `&role=${role}` : ""}`,
		),
	setRole: (id: string, role: Role) =>
		api(`/admin/users/${id}/role`, "PUT", { role }),
	suspend: (id: string) => api(`/admin/users/${id}/suspend`, "POST"),
	restore: (id: string) => api(`/admin/users/${id}/restore`, "POST"),
};

const blocksPath = (id: string, pageId: string | null) =>
	pageId ? `/courses/${id}/pages/${pageId}/blocks` : `/courses/${id}/blocks`;
