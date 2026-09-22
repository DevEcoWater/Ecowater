// mqtt is listed in experimental.serverComponentsExternalPackages, so Next
// leaves it out of the bundle and traces it into the standalone output. The
// import is dynamic so a missing package surfaces as a handled 502 rather than
// crashing the route module at load.
//
// Do NOT put webpackIgnore back on it: that hides the import from the
// dependency tracer, the package stops being copied into the standalone build,
// and valve control dies in production with "Cannot find package 'mqtt'".

export type ValveCommand = "OPEN" | "CLOSE";

export class MqttBrokerError extends Error {
  readonly code = "MQTT_BROKER_ERROR" as const;
  constructor(message: string) {
    super(message);
    this.name = "MqttBrokerError";
  }
}

const HEX_DATA: Record<ValveCommand, string> = {
  OPEN:  "6810AAAAAAAAAAAAAA0404A01700553216",
  CLOSE: "6810AAAAAAAAAAAAAA0404A01700997616",
};

export function getValveTopic(devEui: string, appId: string): string {
  return `application/${appId}/device/${devEui}/tx`;
}

export async function publishValveCommand(
  command: ValveCommand,
  devEui: string,
  appId: string
): Promise<void> {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  if (!brokerUrl) throw new MqttBrokerError("MQTT_BROKER_URL no configurado");

  const { default: mqtt } = await import("mqtt");

  const topic   = getValveTopic(devEui, appId);

  // EXPERIMENTO (ED-88): replica byte a byte el payload que Mariano publica a
  // mano desde HiveMQ y que si funciona — una linea, con espacios despues de
  // '{', de cada ':' y de cada ',', y antes de '}'. JSON.stringify los omite.
  // Si el parser de apsSrv resulta ser tolerante, volver a JSON.stringify.
  const payload = `{ "confirmed": true, "fPort": 2, "data": "${HEX_DATA[command]}" }`;

  return new Promise((resolve, reject) => {
    const client = mqtt.connect(brokerUrl, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      connectTimeout: 5000,
      reconnectPeriod: 0,
      clean: true,
    });

    const hardDeadline = setTimeout(() => {
      client.end(true);
      reject(new MqttBrokerError("Timeout de conexión MQTT (6s)"));
    }, 6000);

    client.on("connect", () => {
      client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
        clearTimeout(hardDeadline);
        client.end(false);
        if (err) reject(err);
        else resolve();
      });
    });

    client.on("error", (err) => {
      clearTimeout(hardDeadline);
      client.end(true);
      reject(new MqttBrokerError(err.message));
    });
  });
}
