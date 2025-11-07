import { NextRequest, NextResponse } from "next/server";
import { customModelProvider } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customOpenRouterModels } = body;

    // Get base models info
    const modelsInfo = customModelProvider.modelsInfo;

    // Find OpenRouter provider and add custom models
    const updatedModelsInfo = modelsInfo.map((providerInfo) => {
      if (providerInfo.provider === "openRouter" && customOpenRouterModels) {
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

    return NextResponse.json(updatedModelsInfo);
  } catch (error) {
    console.error("Error getting models:", error);
    return NextResponse.json(
      { error: "Failed to get models" },
      { status: 500 },
    );
  }
}
