import { NextResponse } from "next/server";
import { getTopics } from "@/lib/getTopics";

export const revalidate = 43200;

export async function GET() {
  const data = await getTopics();
  return NextResponse.json(data);
}
