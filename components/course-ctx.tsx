"use client";
import { createContext, useContext } from "react";
import type { Course } from "../lib/api";

type Ctx = { course: Course; setCourse: (c: Course) => void };
export const CourseCtx = createContext<Ctx | null>(null);
export function useCourse() {
	const c = useContext(CourseCtx);
	if (!c) throw new Error("useCourse outside the editor layout");
	return c;
}
