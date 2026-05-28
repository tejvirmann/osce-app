import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, PhoneIcon, FlaskConicalIcon } from "lucide-react";
import type { OsceScenario } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const scenarios = await db.osceScenario.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">OSCE Voice Platform</h1>
            <p className="text-sm text-muted-foreground">Professor Dashboard</p>
          </div>
          <Button render={<Link href="/create" />}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-20 text-center">
            <p className="text-muted-foreground">No scenarios yet.</p>
            <Button render={<Link href="/create" />} className="mt-4">
              Create your first OSCE
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((s: OsceScenario) => {
              const spec = s.spec as { patient?: { chief_complaint?: string } };
              return (
                <Card key={s.id} className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        {spec?.patient?.chief_complaint && (
                          <CardDescription className="mt-1">
                            {spec.patient.chief_complaint}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={s.status === "published" ? "default" : "secondary"}>
                        {s.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-3" />
                    <div className="flex items-center gap-3">
                      {s.twilioNumber && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          {s.twilioNumber}
                        </span>
                      )}
                      <div className="flex gap-2 ml-auto">
                        <Button size="sm" variant="outline" render={<Link href={`/osces/${s.id}/test`} />}>
                          <FlaskConicalIcon className="mr-1.5 h-3.5 w-3.5" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline" render={<Link href={`/osces/${s.id}`} />}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
