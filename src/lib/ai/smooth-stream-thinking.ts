import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";

type Options = { chunking?: "word" | "line" | RegExp };

/** Adds the opening reasoning tag missing from Hermes responses. */
export const smoothStreamWithThinking =
  <TOOLS extends ToolSet>(_options: Options = {}): StreamTextTransform<TOOLS> =>
  ({ stopStream: _stopStream }) => {
    let buffer = "";
    let reasoningStarted = false;
    let reasoningFinished = false;
    let partId = "hermes-qwen-thinking";
    let providerMetadata: any;

    const emitReasoning = (
      controller: TransformStreamDefaultController<TextStreamPart<TOOLS>>,
      text: string,
    ) => {
      if (!text) return;
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
        text,
        providerMetadata,
      } as TextStreamPart<TOOLS>);
    };

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (part.type !== "text-delta") {
          controller.enqueue(part);
          return;
        }

        partId = part.id;
        providerMetadata = part.providerMetadata;
        buffer += part.text;

        if (!buffer.startsWith("<think>")) buffer = `<think>${buffer}`;

        if (!reasoningFinished) {
          buffer = buffer.slice("<think>".length);
          const end = buffer.indexOf("</think>");
          if (end === -1) {
            const closingTag = "</think>";
            const keep = Math.min(
              buffer.length,
              [...Array(closingTag.length).keys()]
                .reverse()
                .find((length) =>
                  closingTag.startsWith(buffer.slice(-length)),
                ) ?? 0,
            );
            emitReasoning(controller, buffer.slice(0, -keep || undefined));
            buffer = buffer.slice(-keep);
            return;
          }

          emitReasoning(controller, buffer.slice(0, end));
          controller.enqueue({
            type: "reasoning-end",
            id: partId,
            providerMetadata,
          } as TextStreamPart<TOOLS>);
          reasoningFinished = true;
          buffer = buffer.slice(end + "</think>".length);
        }

        if (buffer) {
          controller.enqueue({
            ...part,
            text: buffer,
          });
          buffer = "";
        }
      },

      flush(controller) {
        if (!reasoningFinished) emitReasoning(controller, buffer);
        if (reasoningStarted && !reasoningFinished) {
          controller.enqueue({
            type: "reasoning-end",
            id: partId,
            providerMetadata,
          } as TextStreamPart<TOOLS>);
        }
      },
    });
  };
