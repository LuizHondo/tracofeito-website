"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/* Runs inline in <head> before paint so the stored theme never flashes. */
export const themeScript = `(()=>{try{var t=localStorage.getItem("theme")}catch(e){}document.documentElement.dataset.theme=t==="light"||t==="dark"?t:matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"})()`;

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme | null>(null);
	useEffect(() => {
		setTheme(document.documentElement.dataset.theme as Theme);
	}, []);

	function toggle() {
		const next: Theme = theme === "light" ? "dark" : "light";
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem("theme", next);
		} catch {}
		setTheme(next);
	}

	const light = theme === "light";
	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={light ? "Usar tema escuro" : "Usar tema claro"}
			title={light ? "Tema escuro" : "Tema claro"}
			className="squishy size-11 justify-center rounded-full text-primary-soft"
		>
			<svg
				aria-hidden="true"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				{light ? (
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
				) : (
					<>
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
					</>
				)}
			</svg>
		</button>
	);
}
