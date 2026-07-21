import { getSession } from "auth/server";
import {
  UIMessage,
  convertToModelMessages,
  smoothStream,
  streamText,
} from "ai";
import { customModelProvider } from "lib/ai/models";
import { withReasoningEffortFallback } from "lib/ai/reasoning-effort-fallback";
import {
  getReasoningEffortSupport,
  getReasoningProviderOptions,
  getValidatedReasoningEffort,
} from "lib/ai/reasoning-effort";
import globalLogger from "logger";
import { buildUserSystemPrompt } from "lib/ai/prompts";
import { getUserPreferences } from "lib/user/server";

import { colorize } from "consola/utils";
import {
  canAccessChatModel,
  MODEL_ACCESS_DENIED_MESSAGE,
} from "lib/ai/model-access";
import type { ReasoningEffort } from "app-types/chat";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Temporary Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, chatModel, instructions, reasoningEffort } = json as {
      messages: UIMessage[];
      chatModel?: {
        provider: string;
        model: string;
      };
      instructions?: string;
      reasoningEffort?: ReasoningEffort;
    };
    if (!canAccessChatModel(session.user.role, chatModel)) {
      return new Response(MODEL_ACCESS_DENIED_MESSAGE, {
        status: 403,
      });
    }
    logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);
    const selectedReasoningEffort = getValidatedReasoningEffort(
      chatModel,
      reasoningEffort,
    );
    const model = withReasoningEffortFallback(
      customModelProvider.getModel(chatModel),
      selectedReasoningEffort
        ? getReasoningEffortSupport(chatModel)
        : undefined,
    );
    const userPreferences =
      (await getUserPreferences(session.user.id)) || undefined;

    return streamText({
      model,
      system: `${buildUserSystemPrompt(session.user, userPreferences)} ${
        instructions ? `\n\n${instructions}` : ""
      }`.trim(),
      messages: convertToModelMessages(messages),
      experimental_transform: smoothStream({ chunking: "word" }),
      providerOptions: getReasoningProviderOptions(
        chatModel,
        selectedReasoningEffort,
      ),
    }).toUIMessageStreamResponse();
  } catch (error: any) {
    logger.error(error);
    return new Response(error.message || "Oops, an error occured!", {
      status: 500,
    });
  }
}
