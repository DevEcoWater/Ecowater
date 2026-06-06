# MQTT Broker Setup

## Runtime folders required on VPS

```bash
/var/www/ecowater/mqtt/
├── config/
│   ├── mosquitto.conf
│   ├── passwords
│   └── certs/
├── data/
└── log/
```

## Required ports

- 1883
- 8883

## Generate password

```bash
docker exec -it ecowater-mqtt sh

mosquitto_passwd -c /mosquitto/config/passwords gateway_001
```
