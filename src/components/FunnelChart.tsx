"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function FunnelChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
