export const parseInstantaneousFlow = (input: string): number => {
  const clean = input.replace(/\D+/g, "");

  if (clean.length < 6) {
    throw new Error("Invalid input. Expected at least 6 digits.");
  }

  const integerPart = clean.slice(6, 8);
  const decimalPart = clean.slice(0, 4);
  const value = parseFloat(`${integerPart}.${decimalPart}`);

  return parseFloat(value.toFixed(4));
};
