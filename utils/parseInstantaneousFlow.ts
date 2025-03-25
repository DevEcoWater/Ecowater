export const parseInstantaneousFlow = (
  input: string,
  unit: string = "m3/h"
): string => {
  const clean = input.replace(/\D+/g, "");

  if (clean.length < 6) {
    throw new Error("Invalid input. Expected at least 6 digits.");
  }

  const integerPart = clean.slice(6, 8);
  const decimalPart = clean.slice(0, 4);
  const value = parseFloat(`${integerPart}.${decimalPart}`);

  return `${value.toFixed(4)}${unit}`;
};
