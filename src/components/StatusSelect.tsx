"use client";

import { useState, useTransition } from "react";
import { updateLeadStatusAction } from "@/app/(dashboard)/leads/actions";
import { STATUS_LABEL } from "@/lib/leads";
import type { LeadStatus } from "@prisma/client";

const OPTIONS: LeadStatus[] = [
  "NEW_LEAD",
  "CONTACT",
  "FOLLOW_UP",
  "QUALIFIED_LEAD",
  "BOOKING",
  "PURCHASE",
  "CLOSED_LOST",
];

const BADGE_CLASS: Record<LeadStatus, string> = {
  NEW_LEAD: "bg-slate-100 text-slate-700",
  CONTACT: "bg-blue-100 text-blue-700",
  FOLLOW_UP: "bg-amber-100 text-amber-700",
  QUALIFIED_LEAD: "bg-indigo-100 text-indigo-700",
  BOOKING: "bg-purple-100 text-purple-700",
  PURCHASE: "bg-brand-100 text-brand-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
};

export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: LeadStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateLeadStatusAction(leadId, next);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCurrent(next);
    });
  }

  return (
    <div>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as LeadStatus)}
        className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${BADGE_CLASS[current]} disabled:opacity-60`}
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {STATUS_LABEL[o]}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-600 mt-1 max-w-[180px]">{error}</p>}
    </div>
  );
}
