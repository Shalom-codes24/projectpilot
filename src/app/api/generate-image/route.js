import { GEMINI_IMAGE_MODEL, getGeminiClient } from "../../../lib/gemini";

export async function POST(request) {
  const gemini = getGeminiClient();
  if (!gemini) {
    return Response.json(
      { error: "Image generation is not configured yet. Add GEMINI_API_KEY to .env.local and restart the app." },
      { status: 503 }
    );
  }

  try {
    const { prompt, consent } = await request.json();
    if (consent !== true) {
      return Response.json({ error: "Confirm AI processing before generating an image." }, { status: 400 });
    }
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000) {
      return Response.json({ error: "A valid visual prompt of up to 4,000 characters is required." }, { status: 400 });
    }

    const interaction = await gemini.interactions.create({
      model: GEMINI_IMAGE_MODEL,
      store: false,
      input: `Create a clear, academically appropriate project illustration. Do not include invented statistics, labels, or citations. ${prompt}`
    });
    const image = interaction.output_image?.data;
    const mimeType = interaction.output_image?.mime_type || "image/png";
    if (!image || image.length > 20 * 1024 * 1024) {
      return Response.json({ error: "Gemini returned no image or an image larger than the supported limit. Try again." }, { status: 502 });
    }
    return Response.json({ image: `data:${mimeType};base64,${image}` });
  } catch (error) {
    const status = error.status === 429 ? 429 : 502;
    return Response.json(
      { error: error.message || "Gemini image generation failed. Check the API key, image model access, and quota." },
      { status }
    );
  }
}
