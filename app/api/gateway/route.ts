import { NextResponse } from "next/server";
import { parseMeterStatus } from "@/utils/parseMeterStatus";
import { parseMeterData, isReadingFrame } from "@/utils/parseMeterData";
import { parseFlowHex } from "@/utils/parseFlowHex";
import { parseInstantaneousFlow } from "@/utils/parseInstantaneousFlow";

export const dynamic = "force-dynamic";
import { parseTemperature } from "@/utils/parseTemperature";
import {
  convertTimestampToArgentinaTime,
  convertTimestampToLocalTime,
} from "@/utils/timestampConverter";
import { prisma } from "@/lib/prisma";

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

    // Log mínimo y seguro para diagnosticar en Vercel
    try {
      const loc = rxInfo?.[0]?.location || {};
      console.log("[GATEWAY] Payload summary", {
        devEUI,
        deviceName,
        applicationID,
        fPort,
        fCnt,
        timestamp,
        rxCount: Array.isArray(rxInfo) ? rxInfo.length : 0,
        loc: {
          latitude: loc?.latitude ?? null,
          longitude: loc?.longitude ?? null,
        },
      });
    } catch (e) {
      console.warn("[GATEWAY] Failed to log payload summary", e);
    }

    // El medidor manda por este mismo endpoint dos clases de trama: la lectura
    // de consumo y la confirmacion de un downlink, que llega unos segundos
    // despues de cada comando de valvula. La segunda es mas corta y no se
    // puede leer con los offsets de la primera: hasta ahora entraba igual al
    // parser, salia todo NaN y el endpoint devolvia 500. Eran uno de cada tres
    // POST del gateway, y ese ruido tapaba cualquier falla real de ingesta.
    if (!isReadingFrame(data)) {
      console.log("[GATEWAY] Trama que no es de lectura, ignorada", {
        devEUI,
        fPort,
        fCnt,
        data: typeof data === "string" ? data.slice(0, 48) : data,
      });
      return NextResponse.json(
        { ok: true, ignored: "not-a-reading-frame" },
        { status: 200 }
      );
    }

    // Cuando ocurrio la lectura. Se toma del `timestamp` unix que manda el
    // gateway y NO de los digitos de fecha que trae el payload, que salen del
    // reloj interno del medidor: medido contra la hora real de llegada, ese
    // reloj estaba casi once horas adelantado, y ninguna cuenta de zona
    // horaria arregla un reloj desajustado. El del gateway coincide al
    // segundo, y es el mismo que ya se venia usando para created_at.
    //
    // Si el gateway no lo manda, vale mas la hora de llegada que un reloj que
    // sabemos que miente. Los digitos crudos quedan igual en `plot`, que
    // guarda el payload hex entero.
    const gatewayTimestamp =
      typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0
        ? convertTimestampToLocalTime(timestamp)
        : new Date().toISOString();
    const readingTimestamp = gatewayTimestamp;

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
    };
    // No sobrescribir lat/lng con null, undefined o 0
    const primaryLat = rxInfo?.[0]?.location?.latitude;
    const primaryLng = rxInfo?.[0]?.location?.longitude;

    const latParsed =
      primaryLat !== undefined && primaryLat !== null && primaryLat !== 0
        ? parseFloat(primaryLat)
        : undefined;
    const lngParsed =
      primaryLng !== undefined && primaryLng !== null && primaryLng !== 0
        ? parseFloat(primaryLng)
        : undefined;

    const updateData: any = {
      device_name: deviceName,
      application_id: applicationID,
      application_name: applicationName,
      status: finalAlertStatus.meter_status,
      operational_status: finalAlertStatus.operational_status,
      updated_at: convertTimestampToArgentinaTime(timestamp),
    };

    // Solo actualizar si vienen coordenadas válidas
    if (latParsed !== undefined) updateData.lat = latParsed;
    if (lngParsed !== undefined) updateData.lng = lngParsed;

    if (latParsed === undefined || lngParsed === undefined) {
      console.log(
        "[GATEWAY] Skipping lat/lng update to avoid null/0 overwrite",
        {
          latValue: primaryLat,
          lngValue: primaryLng,
        },
      );
    }

    const meter = await prisma.meter.upsert({
      where: { dev_eui: devEUI },
      update: updateData,
      create: {
        dev_eui: devEUI,
        device_name: deviceName,
        application_id: applicationID,
        application_name: applicationName,
        lat: latParsed ?? null,
        lng: lngParsed ?? null,
        status: finalAlertStatus.meter_status,
        operational_status: finalAlertStatus.operational_status,
        created_at: convertTimestampToArgentinaTime(timestamp),
      },
    });

    const reading = await prisma.reading.create({
      data: {
        meter_id: meter.id,
        timestamp: readingTimestamp,
        plot: data,
        fCnt,
        fPort,
        adr,
        cumulative_flow: parsedValues.cumulativeFlow.toString(),
        cumulative_daily_flow: parsedValues.cumulativeDailyFlow.toString(),
        reverse_flow: parsedValues.reverseFlow.toString(),
        instantaneous_flow: parsedValues.instantaneousFlow.toString(),
        real_time_temperature: parsedValues.realTimeTemperature.toString(),
        alarm_status: alarmStatus,
        error_code: null,
        spare: spare,
        check_code: parseData.checkCode,
        ending_code: parseData.endingCode,
        status: "VALID",
      },
    });

    await prisma.status.create({
      data: {
        reading_id: reading.id,
        valve_status: finalAlertStatus.valve_status,
        battery_voltage: finalAlertStatus.battery_voltage,
        battery_status: finalAlertStatus.battery_status,
        empty_pipe_alarm: finalAlertStatus.empty_pipe_alarm,
        reverse_flow_alarm: finalAlertStatus.reverse_flow_alarm,
        over_range_alarm: finalAlertStatus.over_range_alarm,
        water_temp_alarm: finalAlertStatus.water_temp_alarm,
        ee_alarm: finalAlertStatus.ee_alarm,
        meter_status: finalAlertStatus.meter_status,
        operational_status: finalAlertStatus.operational_status,
        created_at: convertTimestampToArgentinaTime(timestamp),
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
          latitude:
            rx.location?.latitude !== undefined &&
            rx.location?.latitude !== null
              ? parseFloat(rx.location.latitude)
              : null,
          longitude:
            rx.location?.longitude !== undefined &&
            rx.location?.longitude !== null
              ? parseFloat(rx.location.longitude)
              : null,
          altitude:
            rx.location?.altitude !== undefined &&
            rx.location?.altitude !== null
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
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error saving meter data", error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { message: "Unknown error saving meter data" },
      { status: 500 },
    );
  }
}
