# MQTT Broker Setup

Mosquitto broker that bridges the backend and the LoRa gateway. The `mqtt` service in `deploy/compose/docker-compose.prod.yml` bind-mounts its runtime from this directory (`deploy/mqtt/`, referenced as `../mqtt` relative to the compose file).

## Runtime layout

```bash
deploy/mqtt/
├── config/
│   ├── mosquitto.conf   # copy from mosquitto.conf.example, then fill in
│   ├── passwords        # generated, gitignored
│   └── certs/           # TLS certs for 8883, gitignored
├── data/                # persistence, gitignored
└── log/                 # gitignored
```

Only `mosquitto.conf.example` and this README are tracked. All runtime secrets and state are gitignored.

## Ports

- `1883` — plain MQTT
- `8883` — MQTT over TLS (requires certs in `config/certs/`)

## Users

The broker runs with `allow_anonymous false`, so every client needs credentials. There are two distinct clients:

```bash
docker exec -it ecowater-mqtt sh

# gateway client
mosquitto_passwd -c /mosquitto/config/passwords gateway_001

# backend client (used by lib/mqtt-client.ts → MQTT_USERNAME / MQTT_PASSWORD)
mosquitto_passwd /mosquitto/config/passwords backend
```

Use `-c` only for the first user (it creates and overwrites the file); omit it for every user after that. Set the backend credentials in `deploy/env/.env.production` as `MQTT_USERNAME` and `MQTT_PASSWORD`.
