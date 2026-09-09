import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">SINYAL CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk untuk mengakses dashboard</p>
        </div>
        <LoginForm next={next || "/"} />
      </div>
    </div>
  );
}
