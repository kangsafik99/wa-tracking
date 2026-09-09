"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

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
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          placeholder="admin@domain.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          placeholder="••••••••"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 text-white text-sm font-medium py-2.5 hover:bg-brand-700 disabled:opacity-60 transition"
      >
        {pending ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
}
