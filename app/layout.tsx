import "./globals.css";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ExpiryBanner } from "../components/ExpiryBanner";
import { Header } from "../components/Header";
import { MeProvider } from "../components/Me";
import { ToastProvider } from "../components/ui";

const display = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["700", "800"],
	variable: "--font-display",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = { title: "Traço Feito" };

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="pt-BR"
			className={`${display.variable} ${sans.variable} ${mono.variable}`}
		>
			<body>
				<MeProvider>
					<ToastProvider>
						<Header />
						<ExpiryBanner />
						{children}
					</ToastProvider>
				</MeProvider>
			</body>
		</html>
	);
}
