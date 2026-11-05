"use client";
import { CourseSettings } from "../../../../components/CourseSettings";
import { useCourse } from "../../../../components/course-ctx";

export default function Settings() {
	const { course, setCourse } = useCourse();
	return <CourseSettings key={course.id} course={course} onSaved={setCourse} />;
}
