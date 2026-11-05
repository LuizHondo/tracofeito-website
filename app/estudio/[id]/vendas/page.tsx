"use client";
import { BlockEditor } from "../../../../components/BlockEditor";
import { useCourse } from "../../../../components/course-ctx";

export default function Selling() {
	const { course } = useCourse();
	return <BlockEditor courseId={course.id} pageId={null} />;
}
