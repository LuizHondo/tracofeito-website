"use client";
import { useRouter } from "next/navigation";
import { CourseSettings } from "../../../components/CourseSettings";
import { StudioGate, VerifyBanner } from "../../../components/studio";

export default function NewCourse() {
	const router = useRouter();
	return (
		<StudioGate>
			{(me) => (
				<>
					<VerifyBanner />
					<main className="mx-auto max-w-[1100px] px-[clamp(16px,3vw,32px)] py-10">
						<h1 className="font-display mb-8 text-[40px] leading-none">
							Novo curso
						</h1>
						{me.emailVerified ? (
							<CourseSettings
								onSaved={(c) => router.push(`/estudio/${c.id}/configuracoes`)}
							/>
						) : (
							<p className="text-muted">
								Confirme seu email para criar cursos.
							</p>
						)}
					</main>
				</>
			)}
		</StudioGate>
	);
}
