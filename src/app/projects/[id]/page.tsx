import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CullingWorkspace, type Project, type Photo } from "./CullingWorkspace";


export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", id)
    .order("captured_at", { ascending: true, nullsFirst: false });

  return (
    <CullingWorkspace
      initialProject={project as Project}
      initialPhotos={(photos ?? []) as Photo[]}
    />
  );
}
