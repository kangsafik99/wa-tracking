"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Circle, CircleNotch, XCircle, CurrencyCircleDollar, PaperPlaneTilt } from "@phosphor-icons/react/ssr";
import { FUNNEL_ORDER, STATUS_LABEL, STATUS_RANK } from "@/lib/leads";
import { Button } from "@/components/ui/Button";
import { markQualifiedAction, markLostAction, sendPurchaseNowAction, sendCustomEventNowAction } from "./actions";
import type { LeadStatus } from "@prisma/client";

type LeadInfo = {
  id: string;
  status: LeadStatus;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ipAddress: string | null;
};

export function LeadActionPanel({ lead }: { lead: LeadInfo }) {
  const [pending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function run(action: string, fn: () => Promise<{ error?: string; message?: string }>) {
    setBusyAction(action);
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      setBusyAction(null);
      if (res.error) setFeedback({ ok: false, text: res.error });
      else setFeedback({ ok: true, text: res.message || "Berhasil." });
    });
  }

  const currentRank = STATUS_RANK[lead.status];

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Journey Status</p>
        <div className="space-y-2.5">
          {FUNNEL_ORDER.map((step, i) => {
            const reached = currentRank >= STATUS_RANK[step];
            const isCurrent = step === lead.status;
            return (
              <div key={step} className="flex items-center gap-2.5">
                {reached ? (
                  <CheckCircle size={17} weight="fill" className="text-brand-600 shrink-0" />
                ) : (
                  <Circle size={17} className="text-slate-300 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    isCurrent ? "font-semibold text-slate-900" : reached ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {i + 1}. {STATUS_LABEL[step]}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-medium bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
              </div>
            );
          })}
          {lead.status === "CLOSED_LOST" && (
            <div className="flex items-center gap-2.5">
              <XCircle size={17} weight="fill" className="text-red-500 shrink-0" />
              <span className="text-sm font-semibold text-red-600">Closed Lost</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Atribusi Meta Ads</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Source</dt>
            <dd className="text-slate-800">{lead.utmSource || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Medium</dt>
            <dd className="text-slate-800">{lead.utmMedium || "-"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-400">Campaign</dt>
            <dd className="text-slate-800 break-words">{lead.utmCampaign || "-"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-400">IP</dt>
            <dd className="text-slate-800 font-mono text-xs">{lead.ipAddress || "-"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Aksi CAPI</p>
        <div className="space-y-2">
          {/* Tombol dengan warna custom sengaja pakai <button> polos, bukan
              <Button variant="secondary">+override - override bg/text via
              className bentrok spesifisitas dengan class dari variant (lihat
              catatan di src/app/(dashboard)/page.tsx soal revenue card). */}
          <button
            type="button"
            disabled={pending}
            onClick={() => run("qualified", () => markQualifiedAction(lead.id))}
            className="w-full inline-flex items-center gap-1.5 rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-sm px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100"
          >
            {busyAction === "qualified" ? <CircleNotch size={15} className="animate-spin" /> : <CheckCircle size={15} weight="fill" />}
            Tandai Qualified
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run("custom", () => sendCustomEventNowAction(lead.id))}
            className="w-full inline-flex items-center gap-1.5 rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-sm px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            {busyAction === "custom" ? <CircleNotch size={15} className="animate-spin" /> : <PaperPlaneTilt size={15} />}
            Kirim Custom Event
          </button>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => run("purchase", () => sendPurchaseNowAction(lead.id))}
          >
            {busyAction === "purchase" ? <CircleNotch size={15} className="animate-spin" /> : <CurrencyCircleDollar size={15} weight="fill" />}
            Kirim Purchase
          </Button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run("lost", () => markLostAction(lead.id))}
            className="w-full inline-flex items-center gap-1.5 rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-sm px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
          >
            {busyAction === "lost" ? <CircleNotch size={15} className="animate-spin" /> : <XCircle size={15} />}
            Tandai Lost / Junk
          </button>
        </div>
        {feedback && (
          <p className={`text-xs mt-2.5 ${feedback.ok ? "text-brand-700" : "text-red-600"}`}>{feedback.text}</p>
        )}
      </div>
    </div>
  );
}
