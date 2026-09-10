"use client";

import { useActionState } from "react";
import { WarningCircle, CircleNotch } from "@phosphor-icons/react/ssr";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/Button";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      return (await loginAction(formData)) ?? {};
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          placeholder="admin@domain.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          placeholder="********"
        />
      </div>
      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <CircleNotch size={16} className="animate-spin" />}
        {pending ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
