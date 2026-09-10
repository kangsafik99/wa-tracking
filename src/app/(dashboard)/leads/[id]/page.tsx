import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/leads";
import { formatDate } from "@/lib/format";
import { StatusSelect } from "@/components/StatusSelect";
import { Card, CardTitle } from "@/components/ui/Card";
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
    { label: "Nomor WA Penerima", value: lead.waDeviceId },
    { label: "External ID", value: lead.externalId },
    { label: "_FBC", value: lead.fbc },
    { label: "_FBP", value: lead.fbp },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition">
        <CaretLeft size={13} />
        Leads
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{lead.name || "Tanpa nama"}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dibuat {formatDate(lead.createdAt)} &middot; Source {lead.source} &middot; Status saat ini{" "}
            {STATUS_LABEL[lead.status]}
          </p>
        </div>
        <StatusSelect leadId={lead.id} status={lead.status} />
      </div>

      <Card>
        <CardTitle className="mb-4">Edit Data</CardTitle>
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
      </Card>

      <Card>
        <CardTitle className="mb-4">Atribusi & Click ID</CardTitle>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-400 mb-0.5">Voucher Code</dt>
            <dd className="font-mono text-slate-900">{lead.voucherCode || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 mb-0.5">UTM Source / Medium</dt>
            <dd className="text-slate-900">
              {lead.utmSource || "—"} / {lead.utmMedium || "—"}
            </dd>
          </div>
          {clickIds.map((c) => (
            <div key={c.label}>
              <dt className="text-xs text-slate-400 mb-0.5">{c.label}</dt>
              <dd className="font-mono text-xs text-slate-900 break-all">{c.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
