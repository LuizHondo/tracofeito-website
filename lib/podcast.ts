import type { EpisodeDetail, EpisodePage } from "./api.ts";
import { serverApi } from "./server.ts";

// Content value: swap for the real channel URL when it is final.
export const podcastUrl = "https://www.youtube.com";

const VIDEO_ID = /^[\w-]{11}$/;

/** First page of episodes for server components; null when the API is down or has no podcast yet. */
export const firstEpisodes = () =>
	serverApi<EpisodePage>("/podcast/episodes").catch(() => null);

/** One episode with description and participants; null for a malformed or unknown id. */
export const episode = (videoId: string) =>
	VIDEO_ID.test(videoId)
		? serverApi<EpisodeDetail>(`/podcast/episodes/${videoId}`)
		: Promise.resolve(null);

/** "20 de out. de 2026", same on server and browser (fixed time zone). */
export const episodeDate = (iso: string) =>
	new Date(iso).toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "America/Sao_Paulo",
	});

/**
 * Splits third-party text into plain parts and http(s) links, so it can be
 * rendered as text nodes and anchors, never as HTML.
 */
export function linkify(text: string): { text: string; href?: string }[] {
	return text
		.split(/(https?:\/\/[^\s<>"']+)/)
		.flatMap((part, i) => {
			if (i % 2 === 0) return [{ text: part }];
			// Sentence punctuation right after a URL is not part of it.
			const url = part.replace(/[.,;:!?)\]]+$/, "");
			return [{ text: url, href: url }, { text: part.slice(url.length) }];
		})
		.filter((p) => p.text);
}
