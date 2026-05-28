import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dograh } from "@/lib/dograh/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { phoneNumber } = await req.json() as { phoneNumber: string };
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workflowId = scenario.dograhWorkflowIdTraining;
  if (!workflowId) {
    return NextResponse.json({ error: "Publish the scenario first to enable test calls" }, { status: 400 });
  }

  try {
    const result = await dograh.initiateCall(Number(workflowId), phoneNumber);
    return NextResponse.json({ runId: result.id });
  } catch (err) {
    console.error("Test call error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate call" },
      { status: 502 }
    );
  }
}
