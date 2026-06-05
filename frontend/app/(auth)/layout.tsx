import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Minimal header */}
      <header className="h-14 flex items-center px-6 border-b border-[#E8E0D8] bg-white">
        <Link href="/" className="font-heading text-lg font-bold text-[#1A1A1A]">
          Solomon Bharat
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
