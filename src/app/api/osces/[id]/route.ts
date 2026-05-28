import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OsceSpecSchema } from "@/lib/schemas/osce";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await db.osceScenario.findUnique({ where: { id } });
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(scenario);
}

const UpdateBody = z.object({
  title: z.string().min(1).optional(),
  spec: OsceSpecSchema.optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = UpdateBody.parse(await req.json());
    const scenario = await db.osceScenario.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.spec && { spec: body.spec as object }),
      },
    });
    return NextResponse.json(scenario);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.osceScenario.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
