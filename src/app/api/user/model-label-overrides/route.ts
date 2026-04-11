import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { NextResponse } from "next/server";
import { z } from "zod";

const ModelLabelOverrideSchema = z.object({
  label: z.string().optional(),
  badge: z.string().optional(),
  updatedAt: z.number(),
});

const ModelLabelOverridesSchema = z.record(
  z.string(),
  ModelLabelOverrideSchema,
);

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const preferences = await userRepository.getPreferences(session.user.id);
    return NextResponse.json(preferences?.modelLabelOverrides ?? {});
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get model label overrides" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await request.json();
    const overrides = ModelLabelOverridesSchema.parse(json);

    const preferences =
      (await userRepository.getPreferences(session.user.id)) ?? {};

    await userRepository.updatePreferences(session.user.id, {
      ...preferences,
      modelLabelOverrides: overrides,
    });

    return NextResponse.json(overrides);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update model label overrides" },
      { status: 500 },
    );
  }
}
