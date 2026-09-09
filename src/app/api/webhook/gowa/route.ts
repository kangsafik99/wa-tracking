import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGowaMessage, verifyGowaSignature } from "@/lib/gowa";
import { processIncomingMessage } from "@/lib/process-incoming";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Gowa webhook endpoint aktif. Arahkan WHATSAPP_WEBHOOK Gowa ke URL ini (POST).",
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyGowaSignature(rawBody, signature)) {
    return NextResponse.json({ status: "error", error: "invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    await prisma.webhookLog.create({
      data: { source: "gowa", event: "unparseable", raw: { raw: rawBody.slice(0, 20000) } },
    });
    return NextResponse.json({ status: "error", error: "invalid JSON" }, { status: 400 });
  }

  const parsedBody = body as { event?: string };
  let result = "ignored: not a message event";

  const message = parseGowaMessage(body as Parameters<typeof parseGowaMessage>[0]);
  if (message) {
    try {
      result = await processIncomingMessage(message);
    } catch (err) {
      result = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  await prisma.webhookLog.create({
    data: {
      source: "gowa",
      event: parsedBody.event ?? null,
      result,
      raw: body as object,
    },
  });

  return NextResponse.json({ status: "done", result });
}
