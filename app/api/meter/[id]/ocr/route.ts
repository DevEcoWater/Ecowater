export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

type Context = { params: { id: string } };

export async function POST(req: Request, { params: _params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64 } = body as { imageBase64?: string };

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 requerido" }, { status: 400 });
    }

    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJson) {
      return NextResponse.json(
        { value: null, error: "Google Vision no configurado" },
        { status: 503 }
      );
    }

    // Load Vision dynamically (serverExternalPackages handles bundling)
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const client = new ImageAnnotatorClient({
      credentials: JSON.parse(credentialsJson),
    });

    const [result] = await client.documentTextDetection({
      image: { content: imageBase64 },
    });

    const fullText = result.fullTextAnnotation?.text ?? "";

    // Extract a meter reading from the OCR text.
    // Mechanical meters display digits followed by 'm' (for m³), e.g. "00157m".
    // The decimal point is implicit: last 2 digits are decimals ("00157" → "001.57").
    // See docs/OCR_METER_FORMAT.md for the full format spec.
    const mPattern = fullText.match(/(\d{3,8})m\b/i);
    if (mPattern) {
      const digits = mPattern[1];
      const integer = digits.slice(0, -2) || "0";
      const decimal = digits.slice(-2);
      const value = `${integer}.${decimal}`;
      return NextResponse.json({ value, rawText: fullText });
    }

    // Fallback: plain numeric value with explicit decimal separator
    const match = fullText.match(/\b\d{3,8}[.,]\d{1,3}\b/);
    const value = match ? match[0].replace(",", ".") : null;

    return NextResponse.json({ value, rawText: fullText });
  } catch (err) {
    console.error("[OCR POST]", err);
    return NextResponse.json({ value: null, error: "Error al procesar imagen" }, { status: 500 });
  }
}
