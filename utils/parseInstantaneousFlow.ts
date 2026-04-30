/**
 * Parsea el flujo instantáneo de un string a un número
 *
 * El proceso es el siguiente:
 * 1. Elimina todos los caracteres no numéricos del input
 * 2. Verifica que el string resultante tenga al menos 8 dígitos
 * 3. Toma los dígitos 5 y 6 (índices 4-5) como la parte entera del número
 * 4. Toma los dígitos 3 y 4 (índices 2-3) junto con los dígitos 1-2 (índices 0-1) como la parte decimal
 * 5. Construye el número final uniendo la parte entera y decimal
 * 6. Redondea el resultado a 4 decimales
 *
 * Ejemplo:
 * Input: "56353700" (Protocol data)
 * Clean: "56353700"
 * Parte entera: "37" (dígitos 5-6)
 * Parte decimal: "3556" (dígitos 3-4 + 1-2)
 * Resultado: 37.3556
 */
export const parseInstantaneousFlow = (input: string): number => {
  const clean = input.replace(/[^a-fA-F0-9]/g, "");

  if (clean.length < 10) {
    throw new Error("Invalid input. Expected at least 8 digits.");
  }

  const integerPart = clean.slice(8, 10) + clean.slice(6, 8);
  const decimalPart = clean.slice(4, 6) + clean.slice(2, 4);
  const value = parseFloat(`${integerPart}.${decimalPart}`);

  return parseFloat(value.toFixed(4));
};
