import { AdminProductEditor } from "@/components/admin/AdminProductEditor";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number(id);
  return <AdminProductEditor productId={id === "nouveau" || !Number.isInteger(numeric) ? null : numeric} />;
}
