import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const prefs = await userRepository.getPreferences(session.user.id);
    return NextResponse.json(prefs?.hiddenModels ?? []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get hidden models" },
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
    const hiddenModels = z.array(z.string()).parse(json);

    const prefs = (await userRepository.getPreferences(session.user.id)) ?? {};
    await userRepository.updatePreferences(session.user.id, {
      ...prefs,
      hiddenModels,
    });

    return NextResponse.json(hiddenModels);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update hidden models" },
      { status: 500 },
    );
  }
}
