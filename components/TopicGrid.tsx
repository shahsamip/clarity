"use client";

import { useState } from "react";
import ResultPanel from "./ResultPanel";

interface Topic {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  question: string;
  emoji: string;
}

interface TopicGridProps {
  topics: Topic[];
}

const categoryColors: Record<string, string> = {
  Technology: "#6366f1",
  Climate: "#22c55e",
  Economy: "#f59e0b",
  Geopolitics: "#ef4444",
  Health: "#ec4899",
  Society: "#8b5cf6",
};

export default function TopicGrid({ topics }: TopicGridProps) {
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <p
          className="text-xs uppercase tracking-widest mb-4 font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          Today&apos;s Topics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topics.map((topic) => {
            const color = categoryColors[topic.category] ?? "#6366f1";
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className="text-left p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: "var(--surface)",
                  border: `1px solid var(--border)`,
                  boxShadow: `0 0 0 0 ${color}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}22`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}66`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                <div className="text-3xl mb-3">{topic.emoji}</div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block"
                  style={{ background: `${color}22`, color }}
                >
                  {topic.category}
                </span>
                <h3
                  className="font-semibold text-base leading-snug mt-2 mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {topic.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {topic.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {activeTopic && (
        <ResultPanel
          title={activeTopic.title}
          question={activeTopic.question}
          emoji={activeTopic.emoji}
          category={activeTopic.category}
          onClose={() => setActiveTopic(null)}
        />
      )}
    </>
  );
}
