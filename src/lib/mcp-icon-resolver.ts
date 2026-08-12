import type { ComponentType } from "react";
import {
  Calendar,
  Cloud,
  CodeIcon,
  Database,
  Facebook,
  Folder,
  Github,
  GitBranch,
  Instagram,
  Linkedin,
  ListTodo,
  Mail,
  MessageCircle,
  Search,
  ShoppingCart,
  Slack,
  Triangle,
} from "lucide-react";

import { MCPIcon } from "ui/mcp-icon";

type McpIcon = ComponentType<{ className?: string }>;

/**
 * Chooses a presentation icon from stable MCP/server/tool keywords.
 *
 * This is intentionally isolated from MCP state and selection logic. If the
 * matcher ever fails, the neutral MCP icon remains the safe default.
 */
export function resolveMcpIcon(
  serverName: string,
  searchableTerms: string[] = [],
): McpIcon {
  try {
    const identity = `${serverName} ${searchableTerms.join(" ")}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");

    if (/\bgithub\b/.test(identity)) return Github;
    if (/\bvercel\b/.test(identity)) return Triangle;
    if (/\bfacebook\b/.test(identity)) return Facebook;
    if (/\binstagram\b/.test(identity)) return Instagram;
    if (/\blinkedin\b/.test(identity)) return Linkedin;
    if (/\bslack\b/.test(identity)) return Slack;
    if (
      /\b(search|query|lookup|find|browse|browser|web|scrape)\b/.test(identity)
    ) {
      return Search;
    }
    if (/\b(calendar|event|schedule|meeting)\b/.test(identity)) {
      return Calendar;
    }
    if (/\b(email|e-mail|mail|inbox)\b/.test(identity)) return Mail;
    if (/\b(database|sql|postgres|mysql|table|record)\b/.test(identity)) {
      return Database;
    }
    if (/\b(file|folder|document|drive|upload|download)\b/.test(identity)) {
      return Folder;
    }
    if (/\b(cart|product|order|shop|store)\b/.test(identity)) {
      return ShoppingCart;
    }
    if (/\b(task|todo|checklist)\b/.test(identity)) return ListTodo;
    if (/\b(code|terminal|execute|run|deploy|function)\b/.test(identity)) {
      return CodeIcon;
    }
    if (/\b(git|branch|commit|repository|repo)\b/.test(identity)) {
      return GitBranch;
    }
    if (/\b(cloud|storage|bucket)\b/.test(identity)) return Cloud;
    if (/\b(message|chat|social)\b/.test(identity)) return MessageCircle;
  } catch {
    // Keep the picker usable even if optional icon matching receives bad data.
  }

  return MCPIcon;
}
