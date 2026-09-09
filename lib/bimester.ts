import { getTodayDateInputAR } from "@/lib/utils";

export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getCurrentBimesterRange(): { startDate: string; endDate: string } {
  const todayAR = getTodayDateInputAR();
  const [year, month] = todayAR.split("-").map(Number);
  const bimesterStartMonth = month % 2 === 0 ? month - 1 : month;
  return {
    startDate: `${year}-${String(bimesterStartMonth).padStart(2, "0")}-01`,
    endDate: todayAR,
  };
}

export function getPreviousBimesterRange(): { startDate: string; endDate: string } {
  const todayAR = getTodayDateInputAR();
  const [year, month] = todayAR.split("-").map(Number);
  const now = new Date(year, month - 1, 1);
  const currentStartMonthIdx =
    now.getMonth() % 2 === 0 ? now.getMonth() : now.getMonth() - 1;
  const previousStart = new Date(
    now.getFullYear(),
    currentStartMonthIdx - 2,
    1
  );
  const previousEnd = new Date(
    previousStart.getFullYear(),
    previousStart.getMonth() + 2,
    0
  );
  return {
    startDate: toDateInput(previousStart),
    endDate: toDateInput(previousEnd),
  };
}

export function isSamePeriod(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string }
): boolean {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}
