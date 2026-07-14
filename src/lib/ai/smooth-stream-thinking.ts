import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";

type Options = { chunking?: "word" | "line" | RegExp };

/** Converts Hermes Qwen's text-only reasoning into AI SDK reasoning parts. */
export const smoothStreamWithThinking =
  <TOOLS extends ToolSet>(_options: Options = {}): StreamTextTransform<TOOLS> =>
  ({ stopStream: _stopStream }) => {
    let buffer = "";
    let firstTextDelta = true;
    let reasoningStarted = false;
    let reasoningFinished = false;
    let partId = "hermes-qwen-thinking";
    let providerMetadata: any;

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (part.type !== "text-delta") {
          controller.enqueue(part);
          return;
        }

        partId = part.id;
        providerMetadata = part.providerMetadata;
        buffer += firstTextDelta
          ? part.text.replace(/^<think>/, "")
          : part.text;
        firstTextDelta = false;

        if (reasoningFinished) {
          controller.enqueue({ ...part, text: buffer });
          buffer = "";
          return;
        }

        const end = buffer.indexOf("</think>");
        if (end === -1) {
          const closingTag = "</think>";
          const keep = Math.min(
            buffer.length,
            [...Array(closingTag.length).keys()]
              .reverse()
              .find((length) => closingTag.startsWith(buffer.slice(-length))) ??
              0,
          );
          const reasoningText = buffer.slice(0, -keep || undefined);
          if (reasoningText) {
            if (!reasoningStarted) {
              reasoningStarted = true;
              controller.enqueue({
                type: "reasoning-start",
                id: partId,
                providerMetadata,
              } as TextStreamPart<TOOLS>);
            }
            controller.enqueue({
              type: "reasoning-delta",
              id: partId,
              text: reasoningText,
              providerMetadata,
            } as TextStreamPart<TOOLS>);
          }
          buffer = buffer.slice(-keep);
          return;
        }

        if (!reasoningStarted) {
          reasoningStarted = true;
          controller.enqueue({
            type: "reasoning-start",
            id: partId,
            providerMetadata,
          } as TextStreamPart<TOOLS>);
        }
        if (buffer.slice(0, end)) {
          controller.enqueue({
            type: "reasoning-delta",
            id: partId,
            text: buffer.slice(0, end),
            providerMetadata,
          } as TextStreamPart<TOOLS>);
        }
        controller.enqueue({
          type: "reasoning-end",
          id: partId,
          providerMetadata,
        } as TextStreamPart<TOOLS>);
        reasoningFinished = true;
        buffer = buffer.slice(end + "</think>".length);
        if (buffer) controller.enqueue({ ...part, text: buffer });
        buffer = "";
      },

      flush(controller) {
        if (!reasoningFinished) {
          if (!reasoningStarted) {
            reasoningStarted = true;
            controller.enqueue({
              type: "reasoning-start",
              id: partId,
              providerMetadata,
            } as TextStreamPart<TOOLS>);
          }
          if (buffer) {
            controller.enqueue({
              type: "reasoning-delta",
              id: partId,
              text: buffer,
              providerMetadata,
            } as TextStreamPart<TOOLS>);
          }
        }
      },
    });
  };
