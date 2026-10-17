import OperarioDetail from "@/components/operarios/operario-detail";

export default function OperarioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="w-full py-4">
      <OperarioDetail id={params.id} />
    </div>
  );
}
