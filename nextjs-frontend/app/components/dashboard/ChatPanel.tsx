"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { sendChatMessage, fetchProjectSummary } from "@/app/lib/api";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  projectNo: number;
  fromPeriod: string;
  toPeriod: string;
  metric: string;
  projectKey: string | null;
}

/** Render AI response text with basic formatting (bold, numbered lists, bullets) */
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        // Numbered list: "1. text" or "1) text"
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-medium text-slate-300">
                {numberedMatch[1]}.
              </span>
              <span className="text-slate-200">
                <InlineBold text={numberedMatch[2]} />
              </span>
            </div>
          );
        }

        // Bullet point: "- text" or "• text"
        const bulletMatch = line.match(/^[-•]\s+(.+)/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span className="text-slate-200">
                <InlineBold text={bulletMatch[1]} />
              </span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-slate-200">
            <InlineBold text={line} />
          </p>
        );
      })}
    </div>
  );
}

/** Render inline **bold** text */
function InlineBold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-white">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ChatPanel({
  projectNo,
  fromPeriod,
  toPeriod,
  metric,
  projectKey,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch system prompt context whenever the project/period changes
  useEffect(() => {
    if (!projectNo || !fromPeriod || !toPeriod) return;

    setMessages([]);
    setSystemPrompt("");
    setError(null);
    setIsLoadingContext(true);

    fetchProjectSummary(projectNo, fromPeriod, toPeriod, metric)
      .then((summaryText) => {
        const prompt = `You are a financial analyst assistant for construction project cost monitoring. 
The following is a cost analysis report for project ${projectKey || projectNo} covering the period from ${fromPeriod} to ${toPeriod}:

${summaryText}

Answer the user's question based on this data. Be specific and reference actual numbers where relevant. 
Format your response with numbered lists and bold text where appropriate for clarity.`;
        setSystemPrompt(prompt);
      })
      .catch((err) => {
        console.error("[ChatPanel] Failed to load project context:", err);
        // Fall back to a generic prompt — still lets the user chat
        setSystemPrompt(
          `You are a financial analyst assistant for construction project cost monitoring. 
Answer questions about project ${projectKey || projectNo} for the period ${fromPeriod} to ${toPeriod}.`,
        );
      })
      .finally(() => setIsLoadingContext(false));
  }, [projectNo, fromPeriod, toPeriod, metric, projectKey]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setIsLoading(true);

    try {
      const answer = await sendChatMessage(trimmed, systemPrompt);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      // Remove the user message so they can retry
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold text-white">
        Ask Questions about this Project
      </h2>

      {/* Message History */}
      {messages.length > 0 && (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3">
              {/* Avatar */}
              {msg.role === "user" ? (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/80 text-xs font-bold text-white">
                  U
                </div>
              ) : (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/80 text-xs font-bold text-white">
                  AI
                </div>
              )}

              {/* Message bubble */}
              {msg.role === "user" ? (
                <div className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white">
                  {msg.content}
                </div>
              ) : (
                <div className="flex-1 rounded-lg bg-slate-800/50 px-4 py-3 text-sm">
                  <FormattedText text={msg.content} />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/80 text-xs font-bold text-white">
                AI
              </div>
              <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-slate-800/50 px-4 py-3">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Input Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoadingContext
                ? "Loading project context..."
                : "Which is the main cost contributor for this project?"
            }
            disabled={isLoading || isLoadingContext}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || isLoadingContext}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
