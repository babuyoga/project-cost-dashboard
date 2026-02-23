"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent } from "react";
import { sendChatMessage } from "@/app/lib/api";
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
  /** The already-loaded project analysis data from the Zustand store */
  analysisData: any;
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

/**
 * Build a text description of the project's cost data from the already-loaded
 * analysisData object. This replaces the old fetchProjectSummary() call that
 * was prone to failure.
 */
function buildContextFromAnalysisData(
  data: any,
  metric: string,
  fromPeriod: string,
  toPeriod: string,
): string {
  if (!data) return "";

  const lines: string[] = [];

  // Project metadata
  if (data.project_meta) {
    lines.push(`Project: ${data.project_meta.description || "N/A"}`);
    lines.push(`Client: ${data.project_meta.client || "N/A"}`);
  }

  // Total metric
  const totalMetric = metric === "forecast_costs_at_completion"
    ? data.total_forecast_costs_at_completion
    : data.total_ytd_actual;

  if (totalMetric) {
    const metricLabel = metric === "forecast_costs_at_completion"
      ? "Forecast Costs at Completion"
      : "YTD Actual";
    lines.push("");
    lines.push(`Metric: ${metricLabel}`);
    lines.push(`Period 1 (${totalMetric.period1}): ${(totalMetric.file1 / 1000).toFixed(2)} million`);
    lines.push(`Period 2 (${totalMetric.period2}): ${(totalMetric.file2 / 1000).toFixed(2)} million`);
    lines.push(`Difference: ${(totalMetric.difference / 1000).toFixed(2)} million`);
  }

  // Cost breakdown by main cost type
  if (data.costline_increases_trajectory && data.costline_increases_trajectory.length > 0) {
    lines.push("");
    lines.push("Cost Breakdown by Main Cost Type (sorted by difference):");
    for (const main of data.costline_increases_trajectory) {
      const diff = (main.difference / 1000).toFixed(2);
      const from = (main.file1_metric / 1000).toFixed(2);
      const to = (main.file2_metric / 1000).toFixed(2);
      lines.push(`  ${main.category}: ${diff} million (from ${from} to ${to} million)`);

      // Subcategories
      if (main.subcategories && main.subcategories.length > 0) {
        for (const sub of main.subcategories) {
          const subDiff = (sub.difference / 1000).toFixed(2);
          const subFrom = (sub.file1_metric / 1000).toFixed(2);
          const subTo = (sub.file2_metric / 1000).toFixed(2);
          lines.push(`    - ${sub.category}: ${subDiff} million (from ${subFrom} to ${subTo} million)`);

          // Children
          if (sub.children && sub.children.length > 0) {
            for (const child of sub.children) {
              const childDiff = (child.difference / 1000).toFixed(2);
              lines.push(`      • ${child.category}: ${childDiff} million`);
            }
          }
        }
      }
    }
  }

  return lines.join("\n");
}

export function ChatPanel({
  projectNo,
  fromPeriod,
  toPeriod,
  metric,
  projectKey,
  analysisData,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build system prompt directly from the already-loaded analysis data
  // No API call needed — the data is already in the store
  const systemPrompt = useMemo(() => {
    const contextText = buildContextFromAnalysisData(analysisData, metric, fromPeriod, toPeriod);

    const prompt = `You are a financial analyst assistant for construction project cost monitoring.
The following is a cost analysis report for project ${projectKey || projectNo} covering the period from ${fromPeriod} to ${toPeriod}:

${contextText}

Answer the user's question based on this data. Be specific and reference actual numbers where relevant.
Format your response with numbered lists and bold text where appropriate for clarity.`;

    console.log(`[ChatPanel] System prompt built from analysisData (${prompt.length} chars)`);
    console.log(`[ChatPanel] Context text length: ${contextText.length} chars`);
    if (contextText.length < 50) {
      console.warn("[ChatPanel] ⚠ Context is very short — analysisData may be empty!");
      console.warn("[ChatPanel] analysisData:", JSON.stringify(analysisData).slice(0, 500));
    }

    return prompt;
  }, [analysisData, metric, fromPeriod, toPeriod, projectKey, projectNo]);

  // Clear messages when project changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [projectNo, fromPeriod, toPeriod, metric]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    console.log('[ChatPanel] Sending message...');
    console.log(`  user_input: ${trimmed}`);
    console.log(`  system_prompt length: ${systemPrompt.length} chars`);

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setIsLoading(true);

    const startTime = Date.now();
    try {
      const answer = await sendChatMessage(trimmed, systemPrompt);
      const elapsed = Date.now() - startTime;
      console.log(`[ChatPanel] ✓ Got answer in ${elapsed}ms (${answer.length} chars)`);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err: unknown) {
      const elapsed = Date.now() - startTime;
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(`[ChatPanel] ✗ Chat failed after ${elapsed}ms:`, msg);
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
            placeholder="Which is the main cost contributor for this project?"
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
