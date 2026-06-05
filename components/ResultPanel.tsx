"use client";

import { useEffect, useRef, useState } from "react";

interface ResultPanelProps {
  title: string;
  question: string;
  emoji?: string;
  category?: string;
  onClose: () => void;
}

export default function ResultPanel({ title, question, emoji, category, onClose }: ResultPanelProps) {
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setAnswer("");
    setThinking("");
    setIsStreaming(true);

    async function stream() {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, topic: title }),
        });

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (isMounted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line) continue;
            if (line.startsWith("t:")) {
              const chunk = JSON.parse(line.slice(2));
              setThinking((prev) => prev + chunk);
            } else if (line.startsWith("a:")) {
              const chunk = JSON.parse(line.slice(2));
              setAnswer((prev) => prev + chunk);
            } else if (line === "d:done") {
              setIsStreaming(false);
            }
          }
        }
      } catch {
        setAnswer("Something went wrong. Please try again.");
      } finally {
        if (isMounted) setIsStreaming(false);
      }
    }

    stream();
    return () => { isMounted = false; };
  }, [question, title]);

  // Auto-scroll answer as it streams
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            {emoji && <span className="text-2xl">{emoji}</span>}
            <div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
              {category && (
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none rounded-full w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        {/* Question */}
        <div className="px-5 py-3 flex-shrink-0" style={{ background: "var(--surface-2)" }}>
          <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
            &ldquo;{question}&rdquo;
          </p>
        </div>

        {/* Thinking toggle */}
        {thinking && (
          <div className="px-5 pt-3 flex-shrink-0">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "#f59e0b" }}>⚡</span>
              {showThinking ? "Hide" : "Show"} AI reasoning
              {isStreaming && thinking && (
                <span className="inline-flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full pulse-dot"
                      style={{ background: "#f59e0b", animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </span>
              )}
            </button>
            {showThinking && (
              <div
                className="mt-2 p-3 rounded-xl text-xs thinking-content max-h-40 overflow-y-auto"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  fontFamily: "monospace",
                }}
              >
                {thinking}
              </div>
            )}
          </div>
        )}

        {/* Answer */}
        <div ref={answerRef} className="flex-1 overflow-y-auto px-5 py-4">
          {!answer && isStreaming && (
            <div className="flex gap-1 items-center" style={{ color: "var(--text-secondary)" }}>
              <span className="text-sm">Thinking</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full pulse-dot"
                  style={{ background: "var(--accent)", animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
          <FormattedAnswer text={answer} />
        </div>

        {/* Footer */}
        {!isStreaming && answer && (
          <div
            className="flex justify-between items-center px-5 py-3 flex-shrink-0 text-xs"
            style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <span>Powered by NVIDIA Nemotron</span>
            <button
              onClick={() => navigator.clipboard.writeText(answer)}
              className="px-3 py-1 rounded-lg transition-colors hover:bg-white/10"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormattedAnswer({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-base font-semibold mt-4 mb-1" style={{ color: "var(--text-primary)" }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-sm font-semibold mt-3 mb-1" style={{ color: "var(--text-primary)" }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={key++} className="flex gap-2 text-sm mb-1" style={{ color: "var(--text-primary)" }}>
          <span style={{ color: "var(--accent)", flexShrink: 0 }}>•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      elements.push(
        <div key={key++} className="flex gap-2 text-sm mb-1" style={{ color: "var(--text-primary)" }}>
          <span style={{ color: "var(--accent)", flexShrink: 0, minWidth: "1.2rem" }}>{num}.</span>
          <span>{line.replace(/^\d+\. /, "")}</span>
        </div>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="text-sm font-semibold mt-2" style={{ color: "var(--text-primary)" }}>
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={key++} className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-primary)" }}>
          {line}
        </p>
      );
    } else {
      elements.push(<div key={key++} className="h-2" />);
    }
  }

  return <>{elements}</>;
}
