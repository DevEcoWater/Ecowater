type MeterStatus = {
  valve_status: "open" | "closed" | "abnormal" | "unknown";
  battery_voltage: "normal" | "low";
  battery_status: boolean;
  empty_pipe_alarm: boolean;
  reverse_flow_alarm: boolean;
  over_range_alarm: boolean;
  water_temp_alarm: boolean;
  ee_alarm: boolean;
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

  return {
    valve_status,
    battery_voltage: batteryVoltageBit === 0 ? "normal" : "low",
    battery_status: Boolean(byte2 & 0b00000001),
    empty_pipe_alarm: Boolean((byte2 >> 1) & 0b1),
    reverse_flow_alarm: Boolean((byte2 >> 2) & 0b1),
    over_range_alarm: Boolean((byte2 >> 3) & 0b1),
    water_temp_alarm: Boolean((byte2 >> 4) & 0b1),
    ee_alarm: Boolean((byte2 >> 5) & 0b1),
  };
}
