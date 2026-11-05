import { redirect } from "next/navigation";

export default async function Index({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	redirect(`/estudio/${(await params).id}/configuracoes`);
}
