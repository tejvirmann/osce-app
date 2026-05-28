import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, FlaskConicalIcon } from "lucide-react";
import { ScenarioEditor } from "@/components/scenario-editor";
import { PublishButton } from "@/components/publish-button";
import type { OsceSpec } from "@/lib/schemas/osce";

export const dynamic = "force-dynamic";

export default async function OsceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) notFound();

  const spec = scenario.spec as OsceSpec;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{scenario.title}</h1>
              <Badge variant={scenario.status === "published" ? "default" : "secondary"}>
                {scenario.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{spec.patient.chief_complaint}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/osces/${id}/test`} />}>
              <FlaskConicalIcon className="mr-1.5 h-3.5 w-3.5" />
              Test
            </Button>
            {scenario.status === "draft" && <PublishButton id={id} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-4">
        {scenario.twilioNumber && (
          <div className="rounded-md border bg-white px-4 py-3 text-sm">
            <span className="text-muted-foreground">Twilio number: </span>
            <span className="font-mono font-medium">{scenario.twilioNumber}</span>
          </div>
        )}
        <Separator />
        <ScenarioEditor id={id} initialSpec={spec} />
      </main>
    </div>
  );
}
