"use client";

import { AdminSidebar } from "@/app/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#020b1c] text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto flex flex-col">
          {children}
      </main>
    </div>
  );
}
