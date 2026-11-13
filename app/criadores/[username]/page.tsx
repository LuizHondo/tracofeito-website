import Link from "next/link";
import { cache } from "react";
import { Avatar } from "../../../components/Avatar";
import { CourseCard } from "../../../components/CourseCard";
import { type CreatorProfile, socialLabels } from "../../../lib/api";
import { serverApi } from "../../../lib/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

// One API read shared by the title and the page.
const load = cache((username: string) =>
	serverApi<CreatorProfile>(`/creators/${encodeURIComponent(username)}`),
);

export async function generateMetadata({ params }: Props) {
	const profile = await load((await params).username);
	return {
		title: profile
			? `@${profile.username} — Traço Feito`
			: "Criador não encontrado — Traço Feito",
	};
}

export default async function CreatorPage({ params }: Props) {
	const profile = await load((await params).username);
	if (!profile)
		return (
			<main className="mx-auto max-w-xl px-4 py-24 text-center">
				<h1 className="font-display mb-4 text-[40px] leading-none">
					Criador não encontrado
				</h1>
				<p className="mb-6 text-muted">
					Esse perfil não existe ou não está disponível.
				</p>
				<Link href="/" className="text-primary-soft">
					Ver todos os cursos
				</Link>
			</main>
		);
	// The API only stores http(s) links; never render anything else as an href.
	const links = profile.socialLinks.filter((l) => /^https?:\/\//i.test(l.url));
	return (
		<main className="mx-auto flex max-w-[1320px] flex-col gap-14 px-[clamp(16px,4vw,56px)] pt-14 pb-24 text-[17px]">
			<section className="flex flex-wrap items-start gap-7">
				<Avatar
					username={profile.username}
					url={profile.avatarUrl}
					size={128}
				/>
				<div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
					<div className="flex flex-col gap-2.5">
						<span className="eyebrow">Criador</span>
						<h1 className="font-display text-[clamp(36px,5vw,64px)] leading-none break-words">
							@{profile.username}
						</h1>
					</div>
					{profile.bio && (
						<p className="max-w-[65ch] whitespace-pre-line text-foreground/80">
							{profile.bio}
						</p>
					)}
					{links.length > 0 && (
						<ul aria-label="Redes sociais" className="flex flex-wrap gap-2.5">
							{links.map((l) => (
								<li key={`${l.kind}-${l.url}`}>
									<a
										href={l.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-[15px] font-medium"
									>
										{socialLabels[l.kind] ?? l.kind}
									</a>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
			{profile.courses.length > 0 && (
				<section aria-labelledby="cursos" className="flex flex-col gap-7">
					<h2
						id="cursos"
						className="font-display text-[clamp(28px,4vw,40px)] leading-none"
					>
						Cursos
					</h2>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-x-6 gap-y-8">
						{profile.courses.map((c) => (
							<CourseCard key={c.id} c={c} />
						))}
					</div>
				</section>
			)}
		</main>
	);
}
