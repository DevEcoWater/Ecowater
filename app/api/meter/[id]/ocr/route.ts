import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// POST /api/meter/[id]/ocr
// Accepts { photo_url: string } and uses Claude Vision to extract the meter reading
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photo_url, base64, media_type } = body;

    let base64Image: string;
    let contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    if (base64) {
      // Direct base64 upload from client
      base64Image = base64;
      contentType = (media_type as typeof contentType) ?? "image/jpeg";
    } else if (photo_url) {
      // Fetch from URL
      const imageResponse = await fetch(photo_url);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "No se pudo obtener la imagen" },
          { status: 400 }
        );
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString("base64");
      contentType =
        (imageResponse.headers.get("content-type") as typeof contentType) ??
        "image/jpeg";
    } else {
      return NextResponse.json(
        { error: "Se requiere photo_url o base64" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: contentType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Extrae el número de metros cúbicos (m³) que muestra el dial del medidor de agua en la imagen. Responde ÚNICAMENTE con el número (puede tener decimales), sin unidades ni texto adicional. Si no puedes leer el valor con certeza, responde con la palabra ILEGIBLE.",
            },
          ],
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (!rawText || rawText.toUpperCase() === "ILEGIBLE") {
      return NextResponse.json({
        value: null,
        error: "No se pudo leer el valor del medidor",
      });
    }

    // Validate that the response is a number
    const numericValue = parseFloat(rawText.replace(",", "."));
    if (isNaN(numericValue)) {
      return NextResponse.json({
        value: null,
        error: "El valor extraído no es un número válido",
      });
    }

    return NextResponse.json({ value: String(numericValue) });
  } catch (error) {
    console.error("[POST OCR]", error);
    return NextResponse.json(
      { value: null, error: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
