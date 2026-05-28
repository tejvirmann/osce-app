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
    // Dograh's initiate-call response schema is unspecified; extract id defensively
    const runId = (result.id ?? result.run_id ?? result.workflow_run_id) as number | undefined;
    if (runId) return NextResponse.json({ runId });
    // Fallback: query the latest run for this workflow
    const runs = await dograh.getLatestRun(Number(workflowId));
    const latestId = runs.runs?.[0]?.id;
    if (!latestId) throw new Error("Call initiated but could not determine run ID");
    return NextResponse.json({ runId: latestId });
  } catch (err) {
    console.error("Test call error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate call" },
      { status: 502 }
    );
  }
}
