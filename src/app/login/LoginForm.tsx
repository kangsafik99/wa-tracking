"use client";

import { useActionState } from "react";
import { WarningCircle, CircleNotch } from "@phosphor-icons/react/ssr";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

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
        <Label className="text-sm text-slate-700">Email</Label>
        <Input name="email" type="email" required autoFocus placeholder="admin@domain.com" className="py-2.5" />
      </div>
      <div>
        <Label className="text-sm text-slate-700">Password</Label>
        <Input name="password" type="password" required placeholder="********" className="py-2.5" />
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
