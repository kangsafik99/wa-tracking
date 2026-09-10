"use client";

import { useState, useTransition } from "react";
import { updateLeadStatusAction } from "@/app/(dashboard)/leads/actions";
import { STATUS_LABEL } from "@/lib/leads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
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

  function handleChange(next: string) {
    setError(null);
    const nextStatus = next as LeadStatus;
    startTransition(async () => {
      const res = await updateLeadStatusAction(leadId, nextStatus);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCurrent(nextStatus);
    });
  }

  const style = STATUS_STYLE[current];

  return (
    <div>
      <Select value={current} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger
          className={cn(
            "w-auto gap-1.5 rounded-full border-0 py-1 pl-2.5 pr-2 text-xs font-medium",
            style.badge,
            pending && "opacity-60"
          )}
        >
          <span className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
            <SelectValue>{STATUS_LABEL[current]}</SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o} value={o}>
              {STATUS_LABEL[o]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[11px] text-red-600 mt-1 max-w-[180px]">{error}</p>}
    </div>
  );
}
