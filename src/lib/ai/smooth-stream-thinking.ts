import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";

type Options = { chunking?: "word" | "line" | RegExp };

/** Adds the opening reasoning tag missing from Hermes responses. */
export const smoothStreamWithThinking =
  <TOOLS extends ToolSet>(_options: Options = {}): StreamTextTransform<TOOLS> =>
  ({ stopStream: _stopStream }) => {
    let firstTextDelta = true;

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (part.type !== "text-delta" || !firstTextDelta) {
          controller.enqueue(part);
          return;
        }

        firstTextDelta = false;
        controller.enqueue({
          ...part,
          text: part.text.startsWith("<think>")
            ? part.text
            : `<think>${part.text}`,
        });
      },
    });
  };
