import { NextResponse } from "next/server";
import { parseMeterStatus } from "@/utils/parseMeterStatus";
import { parseMeterData } from "@/utils/parseMeterData";
import { parseFlowHex } from "@/utils/parseFlowHex";
import { parseInstantaneousFlow } from "@/utils/parseInstantaneousFlow";
import { parseTemperature } from "@/utils/parseTemperature";
import { parseTimestamp } from "@/utils/parseTimestamp ";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      rxInfo,
    } = body;

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

    // Upsert the meter
    const meter = await prisma.meter.upsert({
      where: { dev_eui: devEUI },
      update: {
        device_name: deviceName,
        application_id: applicationID,
        application_name: applicationName,
        lat: rxInfo[0]?.location?.latitude
          ? parseFloat(rxInfo[0].location.latitude)
          : null,
        lng: rxInfo[0]?.location?.longitude
          ? parseFloat(rxInfo[0].location.longitude)
          : null,
        status: finalAlertStatus.meter_status,
        operational_status: finalAlertStatus.operational_status,
      },
      create: {
        dev_eui: devEUI,
        device_name: deviceName,
        application_id: applicationID,
        application_name: applicationName,
        lat: rxInfo[0]?.location?.latitude
          ? parseFloat(rxInfo[0].location.latitude)
          : null,
        lng: rxInfo[0]?.location?.longitude
          ? parseFloat(rxInfo[0].location.longitude)
          : null,
        status: finalAlertStatus.meter_status,
        operational_status: finalAlertStatus.operational_status,
      },
    });

    const reading = await prisma.reading.create({
      data: {
        meter_id: meter.id,
        timestamp: new Date(timestamp * 1000).toISOString(),
        plot: data,
        fCnt,
        fPort,
        adr,
        cumulative_flow: parsedValues.cumulativeFlow,
        cumulative_daily_flow: parsedValues.cumulativeDailyFlow,
        reverse_flow: parsedValues.reverseFlow,
        instantaneous_flow: parsedValues.instantaneousFlow,
        real_time_temperature: parsedValues.realTimeTemperature,
        alarm_status: alarmStatus,
        error_code: null,
        spare: spare,
        check_code: parseData.checkCode,
        ending_code: parseData.endingCode,
        status: "VALID",
      },
    });

    for (const rx of rxInfo) {
      const gateway = await prisma.gateway.upsert({
        where: { gateway_code: rx.gatewayID },
        update: {},
        create: {
          gateway_code: rx.gatewayID,
        },
      });

      await prisma.rxInfo.create({
        data: {
          reading_id: reading.id,
          gateway_id: gateway.id,
          lora_snr: rx.loRaSNR,
          rssi: rx.rssi,
          latitude: rx.location?.latitude
            ? parseFloat(rx.location.latitude)
            : null,
          longitude: rx.location?.longitude
            ? parseFloat(rx.location.longitude)
            : null,
          altitude: rx.location?.altitude
            ? parseFloat(rx.location.altitude)
            : null,
          time: rx.time,
          error_detail: null,
          status: "RECEIVED",
        },
      });
    }

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
