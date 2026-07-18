import "dotenv/config";

type ModelResult = {
  model: string;
  request: number;
  ttftMs: number | null;
  firstEventMs: number | null;
  totalMs: number;
  outputChars: number;
  error?: string;
};

const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
const requestCount = 4;
const prompt = "Reply with exactly one short sentence: what is 2 plus 2?";
const models = ["mistralai/mistral-nemotron", "openai/gpt-oss-20b"];

function nowMs() {
  return performance.now();
}

function extractText(delta: Record<string, unknown>) {
  const content = delta.content;
  const reasoning = delta.reasoning_content;
  return [content, reasoning].find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

async function benchmark(model: string, request: number): Promise<ModelResult> {
  const startedAt = nowMs();
  let firstEventMs: number | null = null;
  let ttftMs: number | null = null;
  let outputChars = 0;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 64,
        stream: true,
        temperature: 0,
        ...(model === "openai/gpt-oss-20b" ? { reasoning_effort: "low" } : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok || !response.body) {
      const body = await response.text();
      throw new Error(`${response.status} ${body.slice(0, 300)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const data = event
          .split("\n")
          .find((line) => line.startsWith("data: "))
          ?.slice(6)
          .trim();
        if (!data || data === "[DONE]") continue;

        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: Record<string, unknown> }>;
        };
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        const text = extractText(delta);
        if (text) {
          const elapsed = nowMs() - startedAt;
          firstEventMs ??= elapsed;
          ttftMs ??= elapsed;
          outputChars += text.length;
        }
      }
    }

    return {
      model,
      request,
      ttftMs,
      firstEventMs,
      totalMs: nowMs() - startedAt,
      outputChars,
    };
  } catch (error) {
    return {
      model,
      request,
      ttftMs,
      firstEventMs,
      totalMs: nowMs() - startedAt,
      outputChars,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatMs(value: number | null) {
  return value == null ? "ERROR" : `${value.toFixed(0)} ms`;
}

if (!process.env.NVIDIA_API_KEY) {
  throw new Error("NVIDIA_API_KEY is not set");
}

console.log(`Endpoint: ${endpoint}`);
console.log(`Requests per model: ${requestCount} (sequential)`);
console.log(`Prompt: ${prompt}`);
console.log("GPT OSS reasoning_effort: low");

for (const model of models) {
  console.log(`\n=== ${model} ===`);
  const results: ModelResult[] = [];

  for (let request = 1; request <= requestCount; request++) {
    const result = await benchmark(model, request);
    results.push(result);
    console.log(
      `request ${request}: TTFT ${formatMs(result.ttftMs)}, total ${result.totalMs.toFixed(0)} ms, chars ${result.outputChars}${result.error ? `, ${result.error}` : ""}`,
    );
  }

  const successful = results
    .map((result) => result.ttftMs)
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);
  const average = successful.length
    ? successful.reduce((sum, value) => sum + value, 0) / successful.length
    : null;
  const median = successful.length
    ? successful[Math.floor((successful.length - 1) / 2)]
    : null;

  console.log(
    `summary: average TTFT ${formatMs(average)}, median TTFT ${formatMs(median)}, successful ${successful.length}/${requestCount}`,
  );
}
