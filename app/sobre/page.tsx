export const metadata = { title: "Sobre nós — Traço Feito" };

export default function Sobre() {
	return (
		<main className="mx-auto flex max-w-[1320px] flex-col gap-16 px-[clamp(16px,4vw,56px)] pt-14 pb-24 text-[17px]">
			<section aria-labelledby="sobre" className="flex flex-col gap-7">
				<div className="flex flex-col gap-2.5">
					<span className="eyebrow">Quem somos</span>
					<h1
						id="sobre"
						className="font-display text-[clamp(44px,6vw,80px)] leading-[0.98]"
					>
						Sobre nós
					</h1>
				</div>
				<div className="flex max-w-[65ch] flex-col gap-4 text-muted">
					<p>
						O Traço Feito começou como um podcast onde conversamos sobre tudo
						com artistas convidados diferentes a cada episódio. Pelo caminho,
						fizemos amigos incríveis que queriam aprender mais sobre o nosso
						processo de criação.
					</p>
					<p>
						Daí alguns dos amigos mais experientes decidiram transformar o que
						sabem em cursos. Para que isso seja financeiramente viável, os
						cursos são pagos: é o que permite aos criadores continuar ensinando
						e a plataforma continuar de pé.
					</p>
				</div>
			</section>

			<section
				aria-labelledby="missao"
				className="flex flex-col gap-7 border-t border-border pt-14"
			>
				<h2
					id="missao"
					className="font-display text-[clamp(36px,4vw,48px)] leading-none"
				>
					Nossa missão
				</h2>
				<p className="max-w-[65ch] text-muted">
					Aproximar quem quer aprender de quem sabe fazer, e garantir que os
					criadores sejam bem pagos pelo que ensinam.
				</p>
			</section>

			<section
				id="criador"
				aria-labelledby="crie"
				className="flex flex-col gap-7 border-t border-border pt-14"
			>
				<h2
					id="crie"
					className="font-display text-[clamp(36px,4vw,48px)] leading-none"
				>
					Crie com a gente
				</h2>
				<p className="max-w-[65ch] text-muted">
					Tem um processo que vale a pena ensinar? Conte para a gente em{" "}
					<a href="mailto:suporte@exemplo.com" className="text-primary-soft">
						suporte@exemplo.com
					</a>{" "}
					e vamos conversar sobre transformar o seu conhecimento em curso.
				</p>
			</section>

			<section
				aria-labelledby="contato"
				className="flex flex-col gap-7 border-t border-border pt-14"
			>
				<h2
					id="contato"
					className="font-display text-[clamp(36px,4vw,48px)] leading-none"
				>
					Fale com a gente
				</h2>
				<p className="text-muted">
					Dúvidas ou sugestões?{" "}
					<a href="mailto:suporte@exemplo.com" className="text-primary-soft">
						suporte@exemplo.com
					</a>
					.
				</p>
			</section>
		</main>
	);
}
