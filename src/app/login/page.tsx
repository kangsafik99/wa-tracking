import { ChatCircleDots } from "@phosphor-icons/react/ssr";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-600 text-white mb-4">
            <ChatCircleDots size={22} weight="fill" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">SINYAL CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk untuk mengakses dashboard</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-7">
          <LoginForm next={next || "/"} />
        </div>
      </div>
    </div>
  );
}
