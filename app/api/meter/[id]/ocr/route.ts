import { NextResponse } from "next/server";

// POST /api/meter/[id]/ocr — OCR not implemented yet
export async function POST() {
  return NextResponse.json(
    { value: null, error: "OCR no disponible" },
    { status: 501 }
  );
}
