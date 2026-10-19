export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-900 to-brand-700 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="text-2xl font-semibold tracking-tight">GPS Office</div>
          <div className="text-sm text-brand-100">Global Pass Services · London</div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-xl">{children}</div>
      </div>
    </main>
  );
}
