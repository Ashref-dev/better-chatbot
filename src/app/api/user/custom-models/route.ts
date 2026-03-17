import { getSession } from "auth/server";
import { CustomModelEntryZodSchema } from "app-types/user";
import { userRepository } from "lib/db/repository";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const preferences = await userRepository.getPreferences(session.user.id);
    return NextResponse.json(preferences?.customModels ?? []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get custom models" },
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
    const models = z.array(CustomModelEntryZodSchema).parse(json);

    const preferences =
      (await userRepository.getPreferences(session.user.id)) ?? {};
    await userRepository.updatePreferences(session.user.id, {
      ...preferences,
      customModels: models,
    });

    return NextResponse.json(models);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update custom models" },
      { status: 500 },
    );
  }
}
