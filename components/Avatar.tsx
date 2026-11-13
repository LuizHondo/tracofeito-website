"use client";
import { useEffect, useRef, useState } from "react";

/** Round avatar from an external URL; falls back to initials when there is none or it fails to load. */
export function Avatar({
	username,
	url,
	size = 64,
}: {
	username: string;
	url?: string | null;
	size?: number;
}) {
	const [failed, setFailed] = useState(false);
	const img = useRef<HTMLImageElement>(null);
	// An image that failed before hydration never fires onError.
	useEffect(() => {
		if (img.current?.complete && img.current.naturalWidth === 0)
			setFailed(true);
	}, []);
	return (
		<span
			className="font-display flex flex-none items-center justify-center overflow-hidden rounded-full border border-silver/60 bg-card-muted"
			style={{ width: size, height: size, fontSize: size * 0.32 }}
		>
			{url && !failed ? (
				// biome-ignore lint/performance/noImgElement: creator-supplied external URLs
				<img
					ref={img}
					src={url}
					alt=""
					onError={() => setFailed(true)}
					className="h-full w-full object-cover"
				/>
			) : (
				username.slice(0, 2).toUpperCase()
			)}
		</span>
	);
}
