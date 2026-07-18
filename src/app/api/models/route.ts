import { NextRequest, NextResponse } from "next/server";
import { customModelProvider } from "@/lib/ai/models";
import {
  filterModelProvidersForRole,
  hasFullModelAccess,
} from "@/lib/ai/model-access";
import { getSession } from "auth/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customOpenRouterModels } = body;

    // Get base models info
    const modelsInfo = customModelProvider.modelsInfo;

    // Find OpenRouter provider and add custom models
    const updatedModelsInfo = modelsInfo.map((providerInfo) => {
      if (
        hasFullModelAccess(session.user.role) &&
        providerInfo.provider === "openRouter" &&
        customOpenRouterModels
      ) {
        const customModels = customOpenRouterModels.map(
          (model: { displayName: string; modelId: string }) => ({
            name: model.displayName,
            isToolCallUnsupported: true, // Conservative default
            isImageInputUnsupported: true,
            supportedFileMimeTypes: [],
          }),
        );

        return {
          ...providerInfo,
          models: [...providerInfo.models, ...customModels],
        };
      }
      return providerInfo;
    });

    return NextResponse.json(
      filterModelProvidersForRole(session.user.role, updatedModelsInfo),
    );
  } catch (error) {
    console.error("Error getting models:", error);
    return NextResponse.json(
      { error: "Failed to get models" },
      { status: 500 },
    );
  }
}
