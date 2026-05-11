import mqtt from "mqtt";

const OPEN_PAYLOAD = Buffer.from("aBCqqqqqqqqqBASgFwBVMhY=", "base64");
const CLOSE_PAYLOAD = Buffer.from("aBCqqqqqqqqqBASgFwCZdhY=", "base64");

export const VALVE_TOPICS = {
  OPEN: "downlink/valve/open",
  CLOSE: "downlink/valve/close",
} as const;

export type ValveCommand = "OPEN" | "CLOSE";

export async function publishValveCommand(command: ValveCommand): Promise<void> {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  if (!brokerUrl) throw new Error("MQTT_BROKER_URL no configurado");

  const topic = VALVE_TOPICS[command];
  const payload = command === "OPEN" ? OPEN_PAYLOAD : CLOSE_PAYLOAD;

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
      reject(new Error("Timeout de conexión MQTT (6s)"));
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
      reject(err);
    });
  });
}
