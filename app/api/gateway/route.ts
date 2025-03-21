import { NextResponse } from "next/server";
import { parseMeterStatus } from "@/utils/parseMeterStatus";
import { parseMeterData } from "@/utils/parseMeterData";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    const parseData = parseMeterData(data);
    const { alarmStatus, spare } = parseData;

    const byte1 = parseInt(alarmStatus, 16);
    const byte2 = parseInt(spare.slice(0, 2), 16);

    const finalAlertStatus = parseMeterStatus(byte1, byte2);
    return NextResponse.json({ parseData, alerts: finalAlertStatus });
  } catch (error) {
    console.error("Error fetching meter data:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching meter data", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
