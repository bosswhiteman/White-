import React from "react";
import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminServer())) {
    redirect("/admin/login");
  }
  return (
    <div className="min-h-screen bg-[#F5F5F7] lg:flex">
      <AdminNav />
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
