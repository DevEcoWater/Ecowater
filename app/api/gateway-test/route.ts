import { NextResponse } from "next/server";
import { parseMeterStatus } from "@/utils/parseMeterStatus";
import { parseMeterData } from "@/utils/parseMeterData";
import { parseFlowHex } from "@/utils/parseFlowHex";
import { parseInstantaneousFlow } from "@/utils/parseInstantaneousFlow";
import { parseTemperature } from "@/utils/parseTemperature";
import { parseTimestamp } from "@/utils/parseTimestamp ";
import { convertTimestampToArgentinaTime } from "@/utils/timestampConverter";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      data,
      devEUI,
      deviceName,
      applicationID,
      applicationName,
      timestamp,
      fCnt,
      fPort,
      adr,
      rxInfo = [],
    } = body;

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

    const primaryLat = rxInfo?.[0]?.location?.latitude;
    const primaryLng = rxInfo?.[0]?.location?.longitude;

    const latParsed =
      primaryLat !== undefined && primaryLat !== null && primaryLat !== 0
        ? parseFloat(primaryLat)
        : null;
    const lngParsed =
      primaryLng !== undefined && primaryLng !== null && primaryLng !== 0
        ? parseFloat(primaryLng)
        : null;

    const fullPayload = {
      devEUI,
      deviceName,
      applicationID,
      applicationName,
      timestamp: timestamp ? convertTimestampToArgentinaTime(timestamp) : undefined,
      fCnt,
      fPort,
      adr,
      parsedValues,
      parsedData: parseData,
      alertStatus: finalAlertStatus,
      location: { lat: latParsed, lng: lngParsed },
      rxInfo,
    };

    console.log("[GATEWAY-TEST] ====== FULL PARSED PAYLOAD ======");
    console.log(JSON.stringify(fullPayload, null, 2));
    console.log("[GATEWAY-TEST] ====================================");

    return NextResponse.json(fullPayload, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error parsing meter data", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error parsing meter data" },
      { status: 500 }
    );
  }
}
