"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PaperPlaneRight, CircleNotch } from "@phosphor-icons/react/ssr";
import { formatTimeWIB } from "@/lib/format";
import { sendReplyAction } from "./actions";

type MessageRow = { id: string; direction: string; body: string; createdAt: Date | string };

export function MessageThread({
  leadId,
  leadName,
  leadPhone,
  messages,
}: {
  leadId: string;
  leadName: string;
  leadPhone: string | null;
  messages: MessageRow[];
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !leadPhone) return;
    setError(null);
    startTransition(async () => {
      const res = await sendReplyAction(leadId, body);
      if (res.error) {
        setError(res.error);
        return;
      }
      setText("");
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-900">{leadName || "Tanpa nama"}</p>
        <p className="text-xs text-slate-400 font-mono">{leadPhone || "-"}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-xl px-3.5 py-2 text-sm ${
                m.direction === "out" ? "bg-brand-100 text-brand-900" : "bg-white text-slate-800 border border-slate-200"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{formatTimeWIB(m.createdAt)}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">Belum ada percakapan.</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-slate-200 p-3 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          disabled={!leadPhone}
          rows={1}
          placeholder={leadPhone ? "Ketik pesan balasan..." : "Lead ini belum punya nomor WA"}
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={pending || !text.trim() || !leadPhone}
          className="grid place-items-center w-10 h-10 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition shrink-0"
        >
          {pending ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneRight size={16} weight="fill" />}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 px-3 pb-2">{error}</p>}
    </div>
  );
}
