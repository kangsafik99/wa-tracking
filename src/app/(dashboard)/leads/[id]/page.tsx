import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/leads";
import { formatDate } from "@/lib/format";
import { StatusSelect } from "@/components/StatusSelect";
import { EditLeadForm } from "./EditLeadForm";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  const clickIds: { label: string; value: string | null }[] = [
    { label: "GCLID", value: lead.gclid },
    { label: "TTCLID", value: lead.ttclid },
    { label: "FBCLID", value: lead.fbclid },
    { label: "CTWA_CLID", value: lead.ctwaClid },
    { label: "External ID", value: lead.externalId },
    { label: "_FBC", value: lead.fbc },
    { label: "_FBP", value: lead.fbp },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/leads" className="text-slate-500 hover:text-slate-900">
          Leads
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-medium">{lead.voucherCode || lead.phone || lead.id}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{lead.name || "Tanpa nama"}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dibuat {formatDate(lead.createdAt)} &middot; Source: {lead.source} &middot; Status saat ini:{" "}
            {STATUS_LABEL[lead.status]}
          </p>
        </div>
        <StatusSelect leadId={lead.id} status={lead.status} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-4">Edit Data</p>
        <EditLeadForm
          leadId={lead.id}
          initial={{
            name: lead.name || "",
            phone: lead.phone || "",
            email: lead.email || "",
            totalValue: lead.totalValue ? String(lead.totalValue) : "",
            branch: lead.branch || "",
            notes: lead.notes || "",
          }}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Atribusi & Click ID</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Voucher Code</dt>
            <dd className="font-mono text-slate-900">{lead.voucherCode || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">UTM Source / Medium</dt>
            <dd className="text-slate-900">
              {lead.utmSource || "—"} / {lead.utmMedium || "—"}
            </dd>
          </div>
          {clickIds.map((c) => (
            <div key={c.label}>
              <dt className="text-slate-500">{c.label}</dt>
              <dd className="font-mono text-xs text-slate-900 break-all">{c.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
