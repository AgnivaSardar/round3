import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TelemetryPoint } from '@/services/api';

type MetricKey = keyof TelemetryPoint;

type SafeRange = {
  min?: number;
  max?: number;
};

const OUT_OF_RANGE_DATA_KEY = '__outOfRangeValue';

// Keep frontend chart ranges aligned with backend health scoring safe ranges.
const TELEMETRY_SAFE_RANGES: Partial<Record<MetricKey, SafeRange>> = {
  engineTemp: { min: 70, max: 105 },
  coolantTemp: { min: 70, max: 100 },
  lubOilPressure: { min: 1.8, max: 4.8 },
  oilPressure: { min: 1.8, max: 4.8 },
  fuelPressure: { min: 10, max: 24 },
  batteryVoltage: { min: 12, max: 14.6 },
  vibrationLevel: { max: 1.2 },
  engineRpm: { min: 650, max: 3800 },
  speed: { min: 0, max: 120 },
};

type ChartPoint = TelemetryPoint & {
  [OUT_OF_RANGE_DATA_KEY]: number | null;
};

type SafeRangeLineChartProps = {
  data: TelemetryPoint[];
  metricKey: MetricKey;
  color: string;
  height?: number;
  strokeWidth?: number;
  isAnimationActive?: boolean;
  xAxisKey?: keyof TelemetryPoint | string;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isOutOfRange = (value: number, safeRange?: SafeRange): boolean => {
  if (!safeRange) return false;
  if (safeRange.min !== undefined && value < safeRange.min) return true;
  if (safeRange.max !== undefined && value > safeRange.max) return true;
  return false;
};

export function SafeRangeLineChart({
  data,
  metricKey,
  color,
  height = 180,
  strokeWidth = 2,
  isAnimationActive = true,
  xAxisKey = 'time',
}: SafeRangeLineChartProps) {
  const safeRange = TELEMETRY_SAFE_RANGES[metricKey];

  const chartData = useMemo<ChartPoint[]>(() => {
    return data.map((point) => {
      const rawValue = point[metricKey];
      const numericValue = isFiniteNumber(rawValue) ? rawValue : null;

      return {
        ...point,
        [OUT_OF_RANGE_DATA_KEY]:
          numericValue !== null && isOutOfRange(numericValue, safeRange)
            ? numericValue
            : null,
      };
    });
  }, [data, metricKey, safeRange]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} className="text-muted-foreground">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" opacity={0.35} />
        <XAxis dataKey={xAxisKey} stroke="currentColor" fontSize={10} />
        <YAxis stroke="currentColor" fontSize={10} />
        <Tooltip
          contentStyle={{
            background: 'hsl(220, 18%, 10%)',
            border: '1px solid hsl(220, 13%, 18%)',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
          labelStyle={{ color: 'hsl(215, 15%, 55%)' }}
          itemStyle={{ color }}
          formatter={(value, _name, item) => {
            if (item?.dataKey === OUT_OF_RANGE_DATA_KEY) {
              return null;
            }

            return value;
          }}
        />

        {safeRange?.min !== undefined && (
          <ReferenceLine
            y={safeRange.min}
            stroke="hsl(215, 15%, 55%)"
            strokeDasharray="6 4"
            strokeOpacity={0.65}
          />
        )}
        {safeRange?.max !== undefined && (
          <ReferenceLine
            y={safeRange.max}
            stroke="hsl(215, 15%, 55%)"
            strokeDasharray="6 4"
            strokeOpacity={0.65}
          />
        )}

        <Line
          type="monotone"
          dataKey={metricKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          isAnimationActive={isAnimationActive}
        />
        <Line
          type="monotone"
          dataKey={OUT_OF_RANGE_DATA_KEY}
          stroke="hsl(0, 72%, 51%)"
          strokeWidth={Math.max(strokeWidth + 0.4, 2.4)}
          dot={{ r: 2.5, fill: 'hsl(0, 72%, 51%)', strokeWidth: 0 }}
          activeDot={{ r: 4, fill: 'hsl(0, 72%, 51%)', strokeWidth: 0 }}
          connectNulls={false}
          isAnimationActive={isAnimationActive}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
