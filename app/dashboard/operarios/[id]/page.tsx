import OperarioDetail from "@/components/operarios/operario-detail";

export default function OperarioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <OperarioDetail id={params.id} />
    </div>
  );
}
