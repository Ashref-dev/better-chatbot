import { ClaudeIcon } from "./claude-icon";
import { GeminiIcon } from "./gemini-icon";
import { GrokIcon } from "./grok-icon";
import { GroqIcon } from "./groq-icon";
import { NvidiaIcon } from "./nvidia-icon";
import { OpenAIIcon } from "./openai-icon";
import { OllamaIcon } from "./ollama-icon";
import { OpenRouterIcon } from "./open-router-icon";
import { LogoIcon } from "./logo-icon";

export function ModelProviderIcon({
  provider,
  className,
}: { provider: string; className?: string }) {
  return provider === "openai" ? (
    <OpenAIIcon className={className} />
  ) : provider === "xai" ? (
    <GrokIcon className={className} />
  ) : provider === "anthropic" ? (
    <ClaudeIcon className={className} />
  ) : provider === "google" ? (
    <GeminiIcon className={className} />
  ) : provider === "ollama" ? (
    <OllamaIcon className={className} />
  ) : provider === "openRouter" ? (
    <OpenRouterIcon className={className} />
  ) : provider === "groq" ? (
    <GroqIcon className={className} />
  ) : provider === "nvidia" ? (
    <NvidiaIcon className={className} />
  ) : (
    <LogoIcon className={className} />
  );
}
