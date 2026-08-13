import { NextResponse } from "next/server";
import { z } from "zod";

import { hasFullModelAccess } from "@/lib/ai/model-access";
import { ModelDiscoveryError, discoverModels } from "@/lib/ai/model-discovery";
import { MODEL_DISCOVERY_PROVIDER_KEYS } from "@/lib/ai/model-discovery-types";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  provider: z.enum(MODEL_DISCOVERY_PROVIDER_KEYS),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFullModelAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Model discovery is not available for your account" },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Send a valid discovery request.",
          code: "INVALID_REQUEST",
        },
        { status: 400 },
      );
    }

    const { provider } = requestSchema.parse(body);
    const preferences = await userRepository.getPreferences(session.user.id);
    const result = await discoverModels(provider, preferences);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ModelDiscoveryError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Choose a supported provider to discover models.",
          code: "INVALID_PROVIDER",
        },
        { status: 400 },
      );
    }

    console.error("Model discovery failed:", error);
    return NextResponse.json(
      {
        error: "Model discovery failed. Please try again.",
        code: "DISCOVERY_FAILED",
      },
      { status: 500 },
    );
  }
}
