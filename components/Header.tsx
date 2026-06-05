"use client";

import { useState } from "react";
import ResultPanel from "./ResultPanel";

interface HeaderProps {
  date: string;
}

const categoryColors: Record<string, string> = {
  Technology: "#6366f1",
  Climate: "#22c55e",
  Economy: "#f59e0b",
  Geopolitics: "#ef4444",
  Health: "#ec4899",
  Society: "#8b5cf6",
};

export default function Header({ date }: HeaderProps) {
  const [customTopic, setCustomTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState<{ title: string; question: string } | null>(null);

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customTopic.trim()) return;
    setActiveTopic({ title: customTopic, question: customTopic });
    setCustomTopic("");
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Clarity
          </h1>
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Updated {date}
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)" }} className="mb-8">
          Real answers to the questions that matter today.
        </p>

        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Ask anything — type your own topic..."
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={!customTopic.trim()}
            className="px-5 py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Ask
          </button>
        </form>

        <div className="flex gap-2 flex-wrap mt-4">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <span
              key={cat}
              className="text-xs px-2 py-1 rounded-full"
              style={{ background: `${color}22`, color }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {activeTopic && (
        <ResultPanel
          title={activeTopic.title}
          question={activeTopic.question}
          onClose={() => setActiveTopic(null)}
        />
      )}
    </>
  );
}

export { categoryColors };
