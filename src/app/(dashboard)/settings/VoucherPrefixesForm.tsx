"use client";

import { useState, useTransition } from "react";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react/ssr";
import { updateVoucherPrefixesAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function VoucherPrefixesForm({ initial }: { initial: string[] }) {
  const [value, setValue] = useState(initial.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateVoucherPrefixesAction(value);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.prefixes) setValue(res.prefixes.join(", "));
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Label>
        Prefix voucher (pisahkan koma, mis. <span className="font-mono">BT, RB, GM</span>)
      </Label>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          className="flex-1 font-mono"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <CircleNotch size={14} className="animate-spin" />}
          Simpan
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && !pending && (
        <p className="text-xs text-brand-700 inline-flex items-center gap-1">
          <CheckCircle size={13} weight="fill" />
          Tersimpan
        </p>
      )}
    </form>
  );
}
