import { MeterStatus, MeterType } from "@prisma/client";

interface LastReading {
  timestamp: Date;
}

/**
 * Derives a map-friendly chip status from a meter's last reading timestamp.
 *
 * Smart meters: ACTIVE when last reading is within 24 h, INACTIVE otherwise.
 * Mechanical meters: keep whatever MeterStatus is stored in the DB.
 */
export function computeChipStatus(
  meterType: MeterType,
  meterDbStatus: MeterStatus,
  lastReading: LastReading | null
): MeterStatus {
  if (meterType === "MECHANICAL") {
    return meterDbStatus;
  }

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const isValidTimestamp =
    lastReading !== null && lastReading.timestamp <= oneHourFromNow;
  const isActive =
    isValidTimestamp &&
    lastReading !== null &&
    lastReading.timestamp >= last24Hours;

  return isActive ? "ACTIVE" : "INACTIVE";
}
