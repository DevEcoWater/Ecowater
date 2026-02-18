import {
  MeterStatus as PrismaMeterStatus,
  OperationalStatus,
} from "@prisma/client";

type MeterStatus = {
  valve_status: "open" | "closed" | "abnormal" | "unknown";
  battery_voltage: "normal" | "low";
  battery_status: boolean;
  empty_pipe_alarm: boolean;
  reverse_flow_alarm: boolean;
  over_range_alarm: boolean;
  water_temp_alarm: boolean;
  ee_alarm: boolean;
  meter_status: PrismaMeterStatus;
  operational_status: OperationalStatus;
};

export function parseMeterStatus(byte1: number, byte2: number): MeterStatus {
  const valveBits = byte1 & 0b00000011;
  const batteryVoltageBit = (byte1 >> 2) & 0b00000001;

  const valve_status =
    valveBits === 0b00
      ? "open"
      : valveBits === 0b01
      ? "closed"
      : valveBits === 0b11
      ? "abnormal"
      : "unknown";

  const battery_voltage = batteryVoltageBit === 0b0 ? "normal" : "low";
  const battery_status = Boolean(byte2 & 0b00000001);
  const empty_pipe_alarm = Boolean((byte2 >> 1) & 0b1);
  const reverse_flow_alarm = Boolean((byte2 >> 2) & 0b1);
  const over_range_alarm = Boolean((byte2 >> 3) & 0b1);
  const water_temp_alarm = Boolean((byte2 >> 4) & 0b1);
  const ee_alarm = Boolean((byte2 >> 5) & 0b1);

  let meter_status: PrismaMeterStatus;
  let operational_status: OperationalStatus;

  const hasCriticalAlarm = empty_pipe_alarm || reverse_flow_alarm;
  const hasAnyAlarm =
    battery_status ||
    empty_pipe_alarm ||
    reverse_flow_alarm ||
    over_range_alarm ||
    water_temp_alarm ||
    ee_alarm;

  if (hasCriticalAlarm) {
    meter_status = "FAULTY";
    operational_status = "ERROR";
  } else if (hasAnyAlarm) {
    meter_status = "MAINTENANCE";
    operational_status = "NEEDS_MAINTENANCE";
  } else {
    meter_status = "ACTIVE";
    operational_status = "OPERATIONAL";
  }

  return {
    valve_status,
    battery_voltage,
    battery_status,
    empty_pipe_alarm,
    reverse_flow_alarm,
    over_range_alarm,
    water_temp_alarm,
    ee_alarm,
    meter_status,
    operational_status,
  };
}
