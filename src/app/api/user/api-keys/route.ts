import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { encrypt, decrypt } from "lib/encryption";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET: Returns which providers have keys set (never returns raw keys)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const prefs = await userRepository.getPreferences(session.user.id);
    const apiKeys = prefs?.apiKeys ?? {};

    // Return provider -> boolean (has key or not) + masked preview
    const result: Record<string, { hasKey: boolean; preview: string }> = {};
    for (const [provider, encrypted] of Object.entries(apiKeys)) {
      try {
        const raw = decrypt(encrypted);
        result[provider] = {
          hasKey: true,
          preview:
            raw.length > 8
              ? `${raw.slice(0, 4)}${"•".repeat(8)}${raw.slice(-4)}`
              : "••••••••",
        };
      } catch {
        result[provider] = { hasKey: false, preview: "" };
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get API keys" },
      { status: 500 },
    );
  }
}

const putSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(1),
});

// PUT: Save an encrypted API key for a provider
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { provider, apiKey } = putSchema.parse(await request.json());
    const encrypted = encrypt(apiKey);

    const prefs = (await userRepository.getPreferences(session.user.id)) ?? {};
    await userRepository.updatePreferences(session.user.id, {
      ...prefs,
      apiKeys: { ...prefs.apiKeys, [provider]: encrypted },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save API key" },
      { status: 500 },
    );
  }
}

const deleteSchema = z.object({
  provider: z.string().min(1),
});

// DELETE: Remove an API key for a provider
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { provider } = deleteSchema.parse(await request.json());

    const prefs = (await userRepository.getPreferences(session.user.id)) ?? {};
    const apiKeys = { ...prefs.apiKeys };
    delete apiKeys[provider];
    await userRepository.updatePreferences(session.user.id, {
      ...prefs,
      apiKeys,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove API key" },
      { status: 500 },
    );
  }
}
