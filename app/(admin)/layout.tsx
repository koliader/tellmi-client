import { AdminGate } from "@/src/widgets/AdminGate";
import { AdminNavbar } from "@/src/widgets/AdminNavbar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGate>
      <AdminNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </AdminGate>
  );
}