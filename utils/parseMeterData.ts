export interface MeterData {
  startCode: string;
  meterType: string;
  meterAddress: string;
  reportingIndicates: string;
  lengthsAndVariables: string;
  protocolIdentificationCode: string;
  cumulativeFlow: string;
  cumulativeDailyFlow: string;
  reverseFlow: string;
  instantaneousFlow: string;
  realTimeTemperature: string;
  timestamps: string;
  alarmStatus: string;
  spare: string;
  checkCode: string;
  endingCode: string;
}

export function parseMeterData(input: string): MeterData {
  if (input.length !== 98) {
    throw new Error(
      `⚠️ Longitud incorrecta. Esperado: 98, Recibido: ${input.length}`
    );
  }

  return {
    startCode: input.slice(0, 2),
    meterType: input.slice(2, 4),
    meterAddress: input.slice(4, 18),
    reportingIndicates: input.slice(18, 20),
    lengthsAndVariables: input.slice(20, 22),
    protocolIdentificationCode: input.slice(22, 28),
    cumulativeFlow: input.slice(28, 38),
    cumulativeDailyFlow: input.slice(38, 48),
    reverseFlow: input.slice(48, 58),
    instantaneousFlow: input.slice(58, 68),
    realTimeTemperature: input.slice(68, 74),
    timestamps: input.slice(74, 88),
    alarmStatus: input.slice(88, 90),
    spare: input.slice(90, 94),
    checkCode: input.slice(94, 96),
    endingCode: input.slice(96, 98),
  };
}
