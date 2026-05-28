import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OsceSpecSchema } from "@/lib/schemas/osce";
import { z } from "zod";

export async function GET() {
  const scenarios = await db.osceScenario.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      twilioNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(scenarios);
}

const CreateBody = z.object({
  title: z.string().min(1),
  spec: OsceSpecSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = CreateBody.parse(await req.json());
    const scenario = await db.osceScenario.create({
      data: { title: body.title, spec: body.spec as object },
    });
    return NextResponse.json(scenario, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
