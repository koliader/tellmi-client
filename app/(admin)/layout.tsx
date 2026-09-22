import { AdminGate } from "@/src/widgets/AdminGate";
import { AdminSidebar } from "@/src/widgets/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGate>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AdminGate>
  );
}