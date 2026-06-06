import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

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
        const params = {
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
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completion = client.chat.completions.create(params as any) as unknown as AsyncIterable<{
          choices: Array<{ delta: { content?: string; reasoning_content?: string } }>;
        }>;

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.reasoning_content) {
            controller.enqueue(
              encoder.encode(`t:${JSON.stringify(delta.reasoning_content)}\n`)
            );
          }
          if (delta?.content) {
            controller.enqueue(
              encoder.encode(`a:${JSON.stringify(delta.content)}\n`)
            );
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Chat stream error:", message);
        controller.enqueue(
          encoder.encode(`a:${JSON.stringify(`Error: ${message}`)}`)
        );
      } finally {
        controller.enqueue(encoder.encode("d:done\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
