"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react/ssr";
import { updateLeadFieldsAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nama" value={form.name} onChange={(v) => set("name", v)} />
        <Field label="No HP" value={form.phone} onChange={(v) => set("phone", v)} mono />
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
        <Field
          label="Total Biaya (Rp)"
          value={form.totalValue}
          onChange={(v) => set("totalValue", v)}
          type="number"
          mono
        />
        <Field label="Cabang" value={form.branch} onChange={(v) => set("branch", v)} />
      </div>
      <div>
        <Label htmlFor="lead-notes">Catatan</Label>
        <textarea
          id="lead-notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <CircleNotch size={16} className="animate-spin" />}
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        {saved && !pending && (
          <span className="inline-flex items-center gap-1 text-sm text-brand-700">
            <CheckCircle size={15} weight="fill" />
            Tersimpan
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cn(mono && "font-mono")} />
    </div>
  );
}
