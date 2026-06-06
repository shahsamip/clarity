export const maxDuration = 300;

export async function POST(req: Request) {
  const { question, topic } = await req.json();

  const systemPrompt = `You are Clarity — a world-affairs analyst who gives honest, well-reasoned answers to important global questions.

Your answers should be:
- Factual and balanced (present multiple perspectives where relevant)
- Structured clearly with headers and bullet points
- Actionable where possible — what can the reader actually DO with this information?
- Written for an intelligent general audience (no jargon without explanation)
- Around 400-600 words

End every response with a "What You Can Do" section with 3 concrete personal actions.`;

  const userMessage = topic
    ? `Topic: ${topic}\n\nQuestion: ${question}`
    : `Question: ${question}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-ultra-550b-a55b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.8,
            top_p: 0.95,
            max_tokens: 8192,
            reasoning_budget: 4096,
            chat_template_kwargs: { enable_thinking: true },
            stream: true,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`NVIDIA API ${res.status}: ${err}`);
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta ?? {};

              if (delta.reasoning_content) {
                controller.enqueue(
                  encoder.encode(`t:${JSON.stringify(delta.reasoning_content)}\n`)
                );
              }
              if (delta.content) {
                controller.enqueue(
                  encoder.encode(`a:${JSON.stringify(delta.content)}\n`)
                );
              }
            } catch {
              // skip malformed SSE line
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Chat stream error:", msg);
        controller.enqueue(encoder.encode(`a:${JSON.stringify(`Error: ${msg}`)}\n`));
      } finally {
        controller.enqueue(encoder.encode("d:done\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
