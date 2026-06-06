import { Suspense } from "react";
import { getTopics } from "@/lib/getTopics";
import TopicGrid from "@/components/TopicGrid";
import Header from "@/components/Header";

export const revalidate = 43200;

export default async function Home() {
  const { topics, date } = await getTopics();

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <Header date={date} />
      <Suspense fallback={<GridSkeleton />}>
        <TopicGrid topics={topics} />
      </Suspense>
    </main>
  );
}

function GridSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-2xl animate-pulse"
          style={{ background: "var(--surface)" }}
        />
      ))}
    </div>
  );
}
