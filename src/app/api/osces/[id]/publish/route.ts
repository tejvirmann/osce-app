import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Stub: will call dograh.createWorkflow() once Dograh API is confirmed
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (scenario.status === "published") {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  // TODO: call dograh.createWorkflow() for training + exam modes
  // const spec = scenario.spec as OsceSpec;
  // const trainingId = await dograh.createWorkflow(buildDograhWorkflow(spec, "training"));
  // const examId = await dograh.createWorkflow(buildDograhWorkflow(spec, "exam"));

  const updated = await db.osceScenario.update({
    where: { id },
    data: { status: "published" },
  });

  return NextResponse.json(updated);
}
