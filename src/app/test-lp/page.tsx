import type { Metadata } from "next";
import { TestLpClient } from "./TestLpClient";

export const metadata: Metadata = {
  title: "Test LP - WA Tracking",
};

export default function TestLpPage() {
  return <TestLpClient />;
}
