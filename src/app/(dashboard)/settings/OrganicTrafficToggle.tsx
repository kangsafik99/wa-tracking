"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { updateShowOrganicTrafficAction } from "./actions";

export function OrganicTrafficToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      await updateShowOrganicTrafficAction(next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={toggle}
      disabled={pending}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
        checked ? "bg-brand-600" : "bg-slate-200",
        pending && "opacity-60"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
