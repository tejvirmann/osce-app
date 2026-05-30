import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dograh } from "@/lib/dograh/client";
import { buildDograhWorkflow } from "@/lib/dograh/build-workflow";
import type { OsceSpec } from "@/lib/schemas/osce";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const spec = scenario.spec as OsceSpec;

  try {
    // Clean up stale Dograh workflows if republishing
    if (scenario.status === "published") {
      const staleIds = [scenario.dograhWorkflowIdTraining, scenario.dograhWorkflowIdExam].filter(Boolean);
      await Promise.allSettled(staleIds.map((wid) => dograh.deleteWorkflow(Number(wid))));
      await db.osceScenario.update({
        where: { id },
        data: { status: "draft", dograhWorkflowIdTraining: null, dograhWorkflowIdExam: null },
      });
    }

    async function createAndPublish(name: string, mode: "training" | "exam") {
      const wf = await dograh.createWorkflow(name, buildDograhWorkflow(spec, mode));
      await dograh.createDraft(wf.id);
      await dograh.publishWorkflow(wf.id);
      return wf;
    }

    const [trainingWorkflow, examWorkflow] = await Promise.all([
      createAndPublish(`${spec.title} — Training`, "training"),
      createAndPublish(`${spec.title} — Exam`, "exam"),
    ]);

    // Save workflow IDs and mark published
    const updated = await db.osceScenario.update({
      where: { id },
      data: {
        status: "published",
        dograhWorkflowIdTraining: String(trainingWorkflow.id),
        dograhWorkflowIdExam: String(examWorkflow.id),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Dograh publish error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish to Dograh" },
      { status: 502 }
    );
  }
}
