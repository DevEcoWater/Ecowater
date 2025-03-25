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
      cumulativeFlow: parseFlowHex(parseData.cumulativeFlow, "m3"),
      cumulativeDailyFlow: parseFlowHex(parseData.cumulativeDailyFlow, "m3"),
      reverseFlow: parseFlowHex(parseData.reverseFlow, "m3"),
      instantaneousFlow: parseInstantaneousFlow(parseData.instantaneousFlow),
      realTimeTemperature: parseTemperature(parseData.realTimeTemperature),
      timestamps: parseTimestamp(parseData.timestamps),
    };

    console.log({
      parseData,
      parsedValues,
      alerts: finalAlertStatus,
    });

    return NextResponse.json({
      meterData: data,
      parseData,
      parsedValues,
      alerts: finalAlertStatus,
    });
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
