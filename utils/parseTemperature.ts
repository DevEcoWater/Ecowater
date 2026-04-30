export const parseTemperature = (raw: string): number => {
  if (raw.length !== 6) {
    throw new Error("Invalid temperature format. Expected 6 characters.");
  }

  const value = parseFloat(
    raw.slice(4, 6) + raw.slice(2, 4) + "." + raw.slice(0, 2),
  );
  
  return parseFloat(value.toFixed(2));
};
