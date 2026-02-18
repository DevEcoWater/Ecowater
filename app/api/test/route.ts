import { NextResponse } from "next/server";
import { parseMeterStatus } from "@/utils/parseMeterStatus";
import { parseMeterData } from "@/utils/parseMeterData";
import { parseFlowHex } from "@/utils/parseFlowHex";
import { parseInstantaneousFlow } from "@/utils/parseInstantaneousFlow";
import { parseTemperature } from "@/utils/parseTemperature";
import { parseTimestamp } from "@/utils/parseTimestamp ";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    const parseData = parseMeterData(data);
    const { alarmStatus, spare } = parseData;
    const byte1 = parseInt(alarmStatus, 16);
    const byte2 = parseInt(spare.slice(0, 2), 16);

    const finalAlertStatus = parseMeterStatus(byte1, byte2);

    const parsedValues = {
      cumulativeFlow: parseFlowHex(parseData.cumulativeFlow),
      cumulativeDailyFlow: parseFlowHex(parseData.cumulativeDailyFlow),
      reverseFlow: parseFlowHex(parseData.reverseFlow),
      instantaneousFlow: parseInstantaneousFlow(parseData.instantaneousFlow),
      realTimeTemperature: parseTemperature(parseData.realTimeTemperature),
      timestamps: parseTimestamp(parseData.timestamps),
    };

    return NextResponse.json(
      { finalAlertStatus, parsedValues, parseData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving meter data:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error saving meter data", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error saving meter data" },
      { status: 500 }
    );
  }
}
