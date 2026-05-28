import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, PhoneIcon, InfoIcon } from "lucide-react";
import { LiveCallPanel } from "@/components/live-call-panel";
import type { OsceSpec } from "@/lib/schemas/osce";

export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) notFound();

  const spec = scenario.spec as OsceSpec;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/osces/${id}`} />}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Test Mode — {scenario.title}</h1>
            <p className="text-sm text-muted-foreground">
              Simulate a student call before publishing
            </p>
          </div>
          <Badge variant={scenario.status === "published" ? "default" : "secondary"} className="ml-auto">
            {scenario.status}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-4">
        {scenario.status === "draft" && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This scenario is a draft. Publish it first to generate Dograh workflows, then return here to test.
            </span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneIcon className="h-4 w-4" />
              Live Test Call — {spec.patient.name}
            </CardTitle>
            <CardDescription>
              Call yourself and watch the patient state machine update in real time as the conversation progresses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveCallPanel
              scenarioId={id}
              workflowId={scenario.dograhWorkflowIdTraining?.toString() ?? null}
              spec={spec}
              disabled={scenario.status === "draft"}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
