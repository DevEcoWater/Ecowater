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
  const filterInput = input.toUpperCase().startsWith("FF")
    ? input.slice(2)
    : input;

  return {
    startCode: filterInput.slice(0, 2),
    meterType: filterInput.slice(2, 4),
    meterAddress: filterInput.slice(4, 18),
    reportingIndicates: filterInput.slice(18, 20),
    lengthsAndVariables: filterInput.slice(20, 22),
    protocolIdentificationCode: filterInput.slice(22, 28),
    cumulativeFlow: filterInput.slice(28, 38),
    cumulativeDailyFlow: filterInput.slice(38, 48),
    reverseFlow: filterInput.slice(48, 58),
    instantaneousFlow: filterInput.slice(58, 68),
    realTimeTemperature: filterInput.slice(68, 74),
    timestamps: filterInput.slice(74, 88),
    alarmStatus: filterInput.slice(88, 90),
    spare: filterInput.slice(90, 94),
    checkCode: filterInput.slice(94, 96),
    endingCode: filterInput.slice(96, 98),
  };
}
