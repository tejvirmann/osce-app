import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dograh } from "@/lib/dograh/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const runId = url.searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) return NextResponse.json({ error: "not found" }, { status: 404 });

  const workflowId = scenario.dograhWorkflowIdTraining;
  if (!workflowId) return NextResponse.json({ error: "not published" }, { status: 400 });

  try {
    const run = await dograh.getRunStatus(Number(workflowId), Number(runId));
    return NextResponse.json(run);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
