export const parseFlowHex = (input: string): number => {
  if (input.includes(".")) {
    return parseFloat(input);
  }

  const cleanHex = input.replace(/\s+|\W+/g, "");
  
  if (cleanHex.length < 10) {
    throw new Error("Invalid hex string. Expected at least 10 characters.");
  }

  const unitCode = cleanHex.slice(0, 2);
  const byte2 = cleanHex.slice(2, 4);
  const byte3 = cleanHex.slice(4, 6);
  const byte4 = cleanHex.slice(6, 8);
  const byte5 = cleanHex.slice(8, 10);

  const unitFactors: Record<string, number> = {
    "2A": 0.0001,
    "2B": 0.001,
    "2C": 0.01,
    "2D": 0.1,
    "2E": 1,
  };

  const factor = unitFactors[unitCode.toUpperCase()] || 0.001; 

  const flowDecimalString = byte5 + byte4 + byte3 + byte2;

  const finalResult = parseInt(flowDecimalString, 10) * factor;

  return parseFloat(finalResult.toFixed(4));
};