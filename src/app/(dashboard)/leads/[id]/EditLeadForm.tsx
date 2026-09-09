"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadFieldsAction } from "../actions";

type Props = {
  leadId: string;
  initial: {
    name: string;
    phone: string;
    email: string;
    totalValue: string;
    branch: string;
    notes: string;
  };
};

export function EditLeadForm({ leadId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateLeadFieldsAction(leadId, form);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nama" value={form.name} onChange={(v) => set("name", v)} />
        <Field label="No HP" value={form.phone} onChange={(v) => set("phone", v)} />
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
        <Field
          label="Total Biaya (Rp)"
          value={form.totalValue}
          onChange={(v) => set("totalValue", v)}
          type="number"
        />
        <Field label="Cabang" value={form.branch} onChange={(v) => set("branch", v)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Catatan</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-60 transition"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        {saved && !pending && <span className="text-sm text-brand-700">Tersimpan.</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
      />
    </div>
  );
}
