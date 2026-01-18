export type TimeRange = "last_hour" | "last_day" | "last_week" | "last_month" | "last_year";

export interface ConsumptionPoint {
  timestamp: string;
  value: number;
}

export interface SocketHistory {
  minute: ConsumptionPoint[];
  hour: ConsumptionPoint[];
  day: ConsumptionPoint[];
  month: ConsumptionPoint[];
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const createSeries = (
  count: number,
  intervalMs: number,
  base: number,
  variance: number,
  now: number
) => {
  const points: ConsumptionPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const timestamp = new Date(now - intervalMs * (count - 1 - index)).toISOString();
    const wave = Math.sin((index / count) * Math.PI * 2);
    const noise = ((index % 5) - 2) * variance * 0.08;
    const value = Math.max(0, base + wave * variance + noise);
    points.push({ timestamp, value: Number(value.toFixed(2)) });
  }
  return points;
};

export const buildSocketHistory = (basePower: number, now: number = Date.now()): SocketHistory => {
  const safeBase = Math.max(1, basePower);
  return {
    minute: createSeries(60, MINUTE_MS, safeBase, safeBase * 0.15, now),
    hour: createSeries(24, HOUR_MS, safeBase * 0.9, safeBase * 0.2, now),
    day: createSeries(30, DAY_MS, safeBase * 0.8, safeBase * 0.25, now),
    month: createSeries(12, DAY_MS * 30, safeBase * 0.7, safeBase * 0.3, now),
  };
};

const sliceForRange = (history: SocketHistory, range: TimeRange) => {
  switch (range) {
    case "last_hour":
      return history.minute;
    case "last_day":
      return history.hour;
    case "last_week":
      return history.day.slice(-7);
    case "last_month":
      return history.day;
    case "last_year":
      return history.month;
    default:
      return history.hour;
  }
};

export const getSeriesForRange = (history: SocketHistory, range: TimeRange) => {
  return sliceForRange(history, range);
};

export const sumSeries = (seriesList: ConsumptionPoint[][]): ConsumptionPoint[] => {
  if (seriesList.length === 0) {
    return [];
  }
  const length = seriesList[0].length;
  const aggregated: ConsumptionPoint[] = [];
  for (let index = 0; index < length; index += 1) {
    const timestamp = seriesList[0][index].timestamp;
    const total = seriesList.reduce((acc, series) => acc + (series[index]?.value ?? 0), 0);
    aggregated.push({ timestamp, value: Number(total.toFixed(2)) });
  }
  return aggregated;
};
