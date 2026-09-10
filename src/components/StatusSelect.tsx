"use client";

import { useState, useTransition } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
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

const STATUS_STYLE: Record<LeadStatus, { badge: string; dot: string }> = {
  NEW_LEAD: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  CONTACT: { badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  FOLLOW_UP: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  QUALIFIED_LEAD: { badge: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  BOOKING: { badge: "bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  PURCHASE: { badge: "bg-brand-100 text-brand-800", dot: "bg-brand-600" },
  CLOSED_LOST: { badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
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

  const style = STATUS_STYLE[current];

  return (
    <div>
      <div className={`relative inline-flex items-center rounded-full ${style.badge} ${pending ? "opacity-60" : ""}`}>
        <span className={`w-1.5 h-1.5 rounded-full ml-2.5 shrink-0 ${style.dot}`} />
        <select
          value={current}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value as LeadStatus)}
          className="appearance-none bg-transparent text-xs font-medium pl-1.5 pr-6 py-1 cursor-pointer focus:outline-none disabled:cursor-default"
        >
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              {STATUS_LABEL[o]}
            </option>
          ))}
        </select>
        <CaretDown size={11} weight="bold" className="absolute right-2 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-red-600 mt-1 max-w-[180px]">{error}</p>}
    </div>
  );
}
