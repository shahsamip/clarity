import OpenAI from "openai";

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  question: string;
  emoji: string;
}

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function getTopics(): Promise<{ topics: Topic[]; date: string }> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `Today is ${today}. You are a world-affairs curator. Generate exactly 12 important topics that people worldwide should understand right now, based on current global events, trends, and pressing issues as of today.

Return ONLY a valid JSON array with exactly 12 objects. No markdown, no explanation, just JSON.

Each object must have:
- "id": a short kebab-case slug (e.g. "ai-job-market")
- "title": a short punchy title (4-7 words max)
- "subtitle": one sentence explaining why this matters today (max 15 words)
- "category": one of: "Technology", "Climate", "Economy", "Geopolitics", "Health", "Society"
- "question": the specific question the AI will answer when clicked (one clear question)
- "emoji": a single relevant emoji

Make topics diverse across categories. Make them feel urgent and relevant to ${today}.`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await client.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    } as any) as { choices: Array<{ message: { content: string } }> };

    const raw = (completion.choices[0]?.message?.content ?? "").trim();
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]") + 1;
    const topics: Topic[] = JSON.parse(raw.slice(jsonStart, jsonEnd));

    return { topics, date: today };
  } catch (err) {
    console.error("Topics generation failed:", err);
    return { topics: getFallbackTopics(), date: today };
  }
}

function getFallbackTopics(): Topic[] {
  return [
    { id: "ai-job-market", title: "Will AI Take Your Job?", subtitle: "Automation is accelerating faster than retraining programs.", category: "Technology", question: "Which jobs are most at risk from AI automation in the next 5 years, and what can workers do to adapt?", emoji: "🤖" },
    { id: "climate-tipping", title: "Climate Tipping Points", subtitle: "Scientists warn several thresholds may be crossed soon.", category: "Climate", question: "How close are we to irreversible climate tipping points, and what does that mean for daily life?", emoji: "🌡️" },
    { id: "us-china-tensions", title: "US-China Trade War", subtitle: "Tariffs are reshaping global supply chains right now.", category: "Geopolitics", question: "What does the current US-China tension mean for everyday consumers and the global economy?", emoji: "🌏" },
    { id: "inflation-savings", title: "Protecting Your Savings", subtitle: "Inflation is eroding purchasing power worldwide.", category: "Economy", question: "How can ordinary people protect their savings from inflation in 2025?", emoji: "💰" },
    { id: "mental-health-crisis", title: "The Mental Health Crisis", subtitle: "Anxiety and depression rates hit historic highs globally.", category: "Health", question: "Why are mental health problems surging worldwide, and what interventions actually work?", emoji: "🧠" },
    { id: "deepfakes-truth", title: "Deepfakes & Truth", subtitle: "Synthetic media is making reality hard to verify.", category: "Society", question: "How do deepfakes threaten democracy and trust, and how can people protect themselves?", emoji: "🎭" },
    { id: "clean-energy-shift", title: "The Clean Energy Race", subtitle: "Solar and wind are now cheaper than fossil fuels.", category: "Climate", question: "Is the global energy transition actually happening fast enough to matter?", emoji: "⚡" },
    { id: "water-scarcity", title: "Global Water Crisis", subtitle: "2 billion people already lack safe drinking water.", category: "Climate", question: "Which regions are running out of water and what are the geopolitical consequences?", emoji: "💧" },
    { id: "global-debt", title: "The Global Debt Bomb", subtitle: "Government debt has reached unprecedented levels.", category: "Economy", question: "Can governments keep borrowing forever, and what happens when they can't?", emoji: "📊" },
    { id: "healthcare-access", title: "Healthcare Inequality", subtitle: "Where you're born still determines if you survive.", category: "Health", question: "What are the biggest gaps in global healthcare access and what's being done about them?", emoji: "🏥" },
    { id: "social-media-youth", title: "Social Media & Youth", subtitle: "Teen mental health declining as screen time rises.", category: "Society", question: "What does the science say about social media's impact on young people, and what should parents do?", emoji: "📱" },
    { id: "nuclear-risk", title: "Nuclear Risk in 2025", subtitle: "More nations are expanding nuclear arsenals.", category: "Geopolitics", question: "How has nuclear risk changed in 2025, and what mechanisms exist to prevent escalation?", emoji: "☢️" },
  ];
}
