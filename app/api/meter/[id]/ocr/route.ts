import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import vision from "@google-cloud/vision";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildVisionClient() {
  const keyEnv = process.env.GOOGLE_CLOUD_VISION_KEY;
  if (keyEnv) {
    return new vision.ImageAnnotatorClient({
      credentials: JSON.parse(keyEnv),
    });
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS env var (file path)
  return new vision.ImageAnnotatorClient();
}

function extractMeterValue(fullText: string): string | null {
  const cleaned = fullText.replace(/\n/g, " ");
  const match = cleaned.match(/\b(\d{1,6}(?:[.,]\d{1,3})?)\b/);
  if (!match) return null;
  return match[1].replace(",", ".");
}

// POST /api/meter/[id]/ocr
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient();
  try {
    const meter = await prisma.meter.findUnique({ where: { id: params.id } });
    if (!meter) {
      return NextResponse.json(
        { value: null, error: "Medidor no encontrado", image_path: "" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    if (!imageFile) {
      return NextResponse.json(
        { value: null, error: "No se recibió imagen", image_path: "" },
        { status: 400 }
      );
    }

    // Save image to public/meter-readings/{meterId}/{timestamp}.jpg
    const timestamp = Date.now();
    const dirPath = path.join(process.cwd(), "public", "meter-readings", params.id);
    const fileName = `${timestamp}.jpg`;
    const filePath = path.join(dirPath, fileName);
    const publicPath = `/meter-readings/${params.id}/${fileName}`;

    await fs.mkdir(dirPath, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Call Google Cloud Vision
    const client = buildVisionClient();
    const [result] = await client.textDetection({
      image: { content: buffer.toString("base64") },
    });

    const fullText = result.fullTextAnnotation?.text ?? "";
    const value = fullText ? extractMeterValue(fullText) : null;

    return NextResponse.json({
      value,
      error: value ? null : "No se pudo detectar un valor en la imagen",
      image_path: publicPath,
    });
  } catch (err) {
    console.error("[OCR] Error:", err);
    return NextResponse.json({
      value: null,
      error: "Error interno al procesar la imagen",
      image_path: "",
    });
  } finally {
    await prisma.$disconnect();
  }
}
