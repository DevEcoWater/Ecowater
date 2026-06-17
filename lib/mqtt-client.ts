// mqtt is in serverExternalPackages — imported dynamically so webpack skips
// static analysis and MODULE_NOT_FOUND is caught at runtime, not at build time.

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

  // webpackIgnore: mqtt is external — skip static resolution
  const { default: mqtt } = await import(/* webpackIgnore: true */ "mqtt");

  const topic   = getValveTopic(devEui, appId);
  const payload = JSON.stringify({ confirmed: true, fPort: 2, data: HEX_DATA[command] });

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
