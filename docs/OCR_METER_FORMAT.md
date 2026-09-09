# OCR — Formato de lectura de medidores mecánicos

## Contexto

El endpoint `POST /api/meter/[id]/ocr` usa Google Cloud Vision (`documentTextDetection`) para leer
el valor del medidor a partir de una foto tomada por el operario en campo.

## Formato del display del medidor

Los medidores mecánicos muestran el valor en una pantalla con dígitos seguidos de la letra `m`
(abreviatura de `m³`). **El punto decimal no está impreso** — es implícito: los últimos 2 dígitos
siempre son decimales.

```
Ejemplo visual en el medidor:
  00157m
       └── 'm' indica m³

Interpretación:
  00157  →  001.57 m³
  ^^^^^
  │└──── últimos 2 dígitos = decimales
  └───── dígitos restantes = parte entera (con ceros a la izquierda)
```

### Ejemplos

| Display del medidor | Valor real (m³) |
|---------------------|-----------------|
| `00157m`            | `001.57`        |
| `01234m`            | `012.34`        |
| `98765m`            | `987.65`        |
| `00010m`            | `000.10`        |

## Lógica de extracción (implementada en `app/api/meter/[id]/ocr/route.ts`)

```
1. Buscar patrón /(\d{3,8})m/i en el rawText de Vision
2. Si hay match:
   - digits = grupo capturado (ej. "00157")
   - integer = digits.slice(0, -2)  →  "001"
   - decimal = digits.slice(-2)      →  "57"
   - value   = `${integer}.${decimal}` →  "001.57"
3. Si no hay match (fallback):
   - Buscar número con separador decimal explícito (\d{3,8}[.,]\d{1,3})
   - Reemplazar coma por punto
4. Si ningún patrón matchea → value = null (OCR falla, el operario reintenta o ingresa manual)
```

## Comportamiento de Vision

Google Vision con `documentTextDetection` devuelve el texto **en orden de lectura** (arriba → abajo,
izquierda → derecha). En estos medidores, el texto típico incluye:

```
MAN U
00157m
nh 1904064 CLASS B
2.202
```

- `00157m` → lectura del medidor ✅
- `1904064` → número de serie (se ignora — no tiene `m` al lado)
- `2.202` → otro valor de referencia del medidor (se ignora en el fallback porque el patrón `m` ya resolvió)

## Consideraciones futuras

- **Cantidad de dígitos variable:** el formato actual soporta 3–8 dígitos antes de `m`. Si los medidores
  tienen más dígitos en el futuro, ajustar el rango en la regex (`\d{3,8}` → `\d{3,10}` por ejemplo).
- **Dígitos decimales variables:** hoy siempre son 2. Si cambia, habría que parametrizar el `slice(-2)`.
- **Medidores digitales/smart:** estos no pasan por OCR manual — usan el pipeline LoRa/gateway.
  El OCR solo aplica a medidores mecánicos (`MeterType.MECHANICAL`).
- **Compresión de imagen:** la foto se comprime a 1000px máximo del lado más largo antes de enviarse
  a Vision (`utils/compressImage.ts`). Si la lectura falla con frecuencia, evaluar subir el límite.
