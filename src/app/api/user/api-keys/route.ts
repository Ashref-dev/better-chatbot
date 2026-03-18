import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { encrypt, decrypt } from "lib/encryption";
import { NextResponse } from "next/server";
import { z } from "zod";

// Check if environment variable exists for a provider
function hasEnvKey(provider: string): boolean {
  switch (provider) {
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "google":
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "xai":
      return !!process.env.XAI_API_KEY;
    case "groq":
      return !!process.env.GROQ_API_KEY;
    case "nvidia":
      return !!process.env.NVIDIA_API_KEY;
    case "openRouter":
      return !!process.env.OPENROUTER_API_KEY;
    default:
      return false;
  }
}

// GET: Returns which providers have keys set (never returns raw keys)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const prefs = await userRepository.getPreferences(session.user.id);
    const apiKeys = prefs?.apiKeys ?? {};

    // Return provider status with user key + env key detection
    const result: Record<
      string,
      { hasUserKey: boolean; hasEnvKey: boolean; preview: string }
    > = {};

    // Check all supported providers
    const providers = [
      "openai",
      "google",
      "anthropic",
      "xai",
      "groq",
      "nvidia",
      "openRouter",
    ];

    for (const provider of providers) {
      const encrypted = apiKeys[provider];
      const envKeyExists = hasEnvKey(provider);

      if (encrypted) {
        try {
          const raw = decrypt(encrypted);
          result[provider] = {
            hasUserKey: true,
            hasEnvKey: envKeyExists,
            preview:
              raw.length > 8
                ? `${raw.slice(0, 4)}${"•".repeat(8)}${raw.slice(-4)}`
                : "••••••••",
          };
        } catch {
          result[provider] = {
            hasUserKey: false,
            hasEnvKey: envKeyExists,
            preview: "",
          };
        }
      } else {
        result[provider] = {
          hasUserKey: false,
          hasEnvKey: envKeyExists,
          preview: "",
        };
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

// POST: Get the actual decrypted key for editing (use with caution)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { provider } = z
      .object({ provider: z.string().min(1) })
      .parse(await request.json());

    const prefs = await userRepository.getPreferences(session.user.id);
    const encrypted = prefs?.apiKeys?.[provider];

    if (!encrypted) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    try {
      const decrypted = decrypt(encrypted);
      return NextResponse.json({ apiKey: decrypted });
    } catch {
      return NextResponse.json(
        { error: "Failed to decrypt key" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get API key" },
      { status: 500 },
    );
  }
}

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
