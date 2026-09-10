import Link from "next/link";
import { ChatsCircle } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/leads";
import { formatTimeWIB } from "@/lib/format";
import { MessageThread } from "./MessageThread";
import { LeadActionPanel } from "./LeadActionPanel";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const sp = await searchParams;

  const leadsWithMessages = await prisma.lead.findMany({
    where: { messages: { some: {} } },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  leadsWithMessages.sort((a, b) => {
    const at = a.messages[0]?.createdAt.getTime() ?? 0;
    const bt = b.messages[0]?.createdAt.getTime() ?? 0;
    return bt - at;
  });

  const selectedLeadId = sp.leadId || leadsWithMessages[0]?.id || null;
  const selectedLead = selectedLeadId ? await prisma.lead.findUnique({ where: { id: selectedLeadId } }) : null;
  const messages = selectedLeadId
    ? await prisma.message.findMany({ where: { leadId: selectedLeadId }, orderBy: { createdAt: "asc" } })
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Inbox</h2>
        <p className="text-sm text-slate-500">Percakapan WhatsApp & aksi cepat CAPI per lead.</p>
      </div>

      <div className="grid grid-cols-[280px_1fr_300px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card h-[calc(100vh-200px)] min-h-[520px]">
        <div className="border-r border-slate-200 overflow-y-auto">
          {leadsWithMessages.map((lead) => {
            const lastMessage = lead.messages[0];
            const active = lead.id === selectedLeadId;
            return (
              <Link
                key={lead.id}
                href={`/inbox?leadId=${lead.id}`}
                className={`block px-4 py-3 border-b border-slate-100 transition ${
                  active ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{lead.name || lead.phone || "Tanpa nama"}</p>
                  {lastMessage && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatTimeWIB(lastMessage.createdAt).replace(" WIB", "")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {lastMessage?.direction === "out" ? "Anda: " : ""}
                  {lastMessage?.body || ""}
                </p>
                <span className="inline-block mt-1.5 text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {STATUS_LABEL[lead.status]}
                </span>
              </Link>
            );
          })}
          {leadsWithMessages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 px-4 text-center text-slate-400">
              <ChatsCircle size={28} className="text-slate-300" />
              <p className="text-sm">Belum ada percakapan masuk.</p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          {selectedLead ? (
            <MessageThread
              leadId={selectedLead.id}
              leadName={selectedLead.name || ""}
              leadPhone={selectedLead.phone}
              messages={messages}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">
              Pilih percakapan di sebelah kiri.
            </div>
          )}
        </div>

        <div className="border-l border-slate-200">
          {selectedLead && (
            <LeadActionPanel
              lead={{
                id: selectedLead.id,
                status: selectedLead.status,
                utmSource: selectedLead.utmSource,
                utmMedium: selectedLead.utmMedium,
                utmCampaign: selectedLead.utmCampaign,
                ipAddress: selectedLead.ipAddress,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
