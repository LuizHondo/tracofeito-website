"use client";
import { useEffect } from "react";

/** Soft synthesized tick on hover and a deeper click on press for every `.squishy` control. */
export function ClickSounds() {
	useEffect(() => {
		let ctx: AudioContext | null = null;
		let hovered: Element | null = null;

		const play = (freq: number, gain: number, ms: number) => {
			ctx ??= new AudioContext();
			if (ctx.state !== "running") return; // browsers block audio before the first gesture
			const t = ctx.currentTime;
			const osc = ctx.createOscillator();
			const vol = ctx.createGain();
			const filter = ctx.createBiquadFilter();
			osc.type = "triangle";
			osc.frequency.setValueAtTime(freq, t);
			osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + ms / 1000);
			filter.type = "lowpass";
			filter.frequency.value = 2400;
			vol.gain.setValueAtTime(gain, t);
			vol.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
			osc.connect(filter).connect(vol).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + ms / 1000);
		};

		const target = (e: Event) =>
			(e.target as Element | null)?.closest?.(".squishy:not(:disabled)") ??
			null;

		const onDown = (e: PointerEvent) => {
			ctx ??= new AudioContext();
			if (ctx.state === "suspended") ctx.resume();
			if (target(e)) play(520, 0.12, 70);
		};
		const onOver = (e: PointerEvent) => {
			if (e.pointerType === "touch") return;
			const el = target(e);
			if (el && el !== hovered) play(1100, 0.04, 45);
			hovered = el;
		};

		document.addEventListener("pointerdown", onDown);
		document.addEventListener("pointerover", onOver);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			document.removeEventListener("pointerover", onOver);
			ctx?.close();
		};
	}, []);
	return null;
}
