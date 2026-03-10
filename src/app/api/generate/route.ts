import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

type GeneratedPayload = {
  caption: string;
  suggestedMediaType: "IMAGE" | "VIDEO" | "CAROUSEL" | "REEL" | "STORY" | "TEXT";
  imagePrompt?: string;
};

function parseJsonPayload(raw: string): GeneratedPayload | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1] || trimmed;

  try {
    const parsed = JSON.parse(fenced) as Partial<GeneratedPayload>;
    if (!parsed.caption) {
      return null;
    }

    const media = parsed.suggestedMediaType || "IMAGE";
    const mediaType = ["IMAGE", "VIDEO", "CAROUSEL", "REEL", "STORY", "TEXT"].includes(media)
      ? (media as GeneratedPayload["suggestedMediaType"])
      : "IMAGE";

    return {
      caption: String(parsed.caption).trim(),
      suggestedMediaType: mediaType,
      imagePrompt: parsed.imagePrompt ? String(parsed.imagePrompt).trim() : undefined,
    };
  } catch {
    return null;
  }
}

function buildPreviewImageUrl(seedSource: string) {
  const seed = encodeURIComponent(seedSource.slice(0, 80) || "aries-ai");
  return `https://picsum.photos/seed/${seed}/1200/1200`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  const platforms = Array.isArray(body.platforms) ? body.platforms : [];
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

  let draftCount: number | null = null;

  try {
    draftCount = await prisma.post.count({ where: { status: "DRAFT" } });
  } catch {
    draftCount = null;
  }

  let generated: GeneratedPayload = {
    caption:
      "Discover handcrafted quality from Sugar and Leather this week. Visit us for a personalized experience.",
    suggestedMediaType: "IMAGE",
  };

  if (geminiApiKey && prompt) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_TEXT_MODEL || "gemini-1.5-flash",
      });

      const completion = await model.generateContent(`
You are an expert social media copywriter for small businesses.
Return JSON only with this shape:
{
  "caption": "string",
  "suggestedMediaType": "IMAGE|VIDEO|CAROUSEL|REEL|STORY|TEXT",
  "imagePrompt": "string"
}

Prompt: ${prompt}
Target platforms: ${platforms.join(", ") || "none"}
Brand: Sugar and Leather
Keep caption concise, engaging, and schedule-ready.
      `);

      const text = completion.response.text();
      const parsed = parseJsonPayload(text);
      if (parsed) {
        generated = parsed;
      }
    } catch {
      // Fall back to default payload when provider call fails.
    }
  }

  const imageUrl = buildPreviewImageUrl(generated.imagePrompt || prompt || generated.caption);

  return NextResponse.json({
    data: {
      caption: generated.caption,
      imageUrl,
      suggestedMediaType: generated.suggestedMediaType,
      platforms,
      prompt,
      draftCount,
    },
    message: geminiApiKey
      ? "Generated with Gemini."
      : "Generated fallback content (set GEMINI_API_KEY to enable live model output).",
  });
}
