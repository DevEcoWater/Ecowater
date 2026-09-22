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

/** Largo minimo de una trama de lectura, en caracteres hex, ya sin preambulo. */
export const READING_FRAME_LENGTH = 98;

/**
 * Saca el preambulo de despertador que el medidor antepone a algunas tramas.
 * Viene como FF o como FEFE segun el tipo de trama, repetido a veces mas de
 * una vez. El parser original solo contemplaba FF, asi que las tramas FEFE
 * quedaban corridas cuatro caracteres y todos los cortes por posicion salian
 * mal.
 */
export function stripPreamble(input: string): string {
  let out = input.trim();
  while (/^(FF|FE)/i.test(out)) out = out.slice(2);
  return out;
}

/**
 * True si la trama tiene pinta de lectura de consumo. Las de confirmacion de
 * downlink llegan por el mismo endpoint, son mas cortas y no se pueden parsear
 * con estos offsets.
 */
export function isReadingFrame(input: string): boolean {
  const f = stripPreamble(input);
  return f.length >= READING_FRAME_LENGTH && f.slice(0, 2).toUpperCase() === "68";
}

export function parseMeterData(input: string): MeterData {
  const filterInput = stripPreamble(input);

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
