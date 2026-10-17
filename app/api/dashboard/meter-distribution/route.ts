import { NextResponse } from "next/server";
import {
  DASHBOARD_TZ,
  getCachedDistribution,
  resolveRange,
} from "@/lib/dashboard/consumption-distribution";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { startDate, endDate } = resolveRange(searchParams, DASHBOARD_TZ);

    const meters = await getCachedDistribution(
      startDate.toISOString(),
      endDate.toISOString()
    );

    return NextResponse.json({ meters });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch meter distribution", detail: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      { status: 500 }
    );
  }
}
