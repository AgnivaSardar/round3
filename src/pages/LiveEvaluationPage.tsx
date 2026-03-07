import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  evaluateVehicleLive,
  fetchHealthEvaluations,
  fetchLatestTelemetry,
  fetchVehicles,
} from '@/services/api';
import type { HealthEvaluation, TelemetryPoint, Vehicle } from '@/services/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Activity, BrainCircuit, Gauge, Play, Sparkles } from 'lucide-react';

const formatValue = (value: number | null | undefined, digits = 2): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  return value.toFixed(digits).replace(/\.00$/, '');
};

const statusClassMap: Record<string, string> = {
  HEALTHY: 'text-success bg-success/10 border-success/30',
  WARNING: 'text-warning bg-warning/10 border-warning/30',
  CRITICAL: 'text-destructive bg-destructive/10 border-destructive/30',
};

const riskClassMap: Record<string, string> = {
  LOW: 'text-success',
  MODERATE: 'text-warning',
  HIGH: 'text-orange-400',
  SEVERE: 'text-destructive',
};

export default function LiveEvaluationPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryPoint | null>(null);
  const [evaluations, setEvaluations] = useState<HealthEvaluation[]>([]);
  const [latestResult, setLatestResult] = useState<HealthEvaluation | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => (vehicle.vehicleId || vehicle.id) === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  useEffect(() => {
    async function loadVehicles() {
      setLoadingVehicles(true);
      try {
        const data = await fetchVehicles();
        setVehicles(data);

        if (data.length > 0) {
          setSelectedVehicleId(data[0].vehicleId || data[0].id);
        }
      } catch (loadError) {
        console.error('Error loading vehicles for evaluation:', loadError);
        setError('Unable to load vehicles for evaluation.');
      } finally {
        setLoadingVehicles(false);
      }
    }

    loadVehicles();
  }, []);

  useEffect(() => {
    async function loadVehicleContext() {
      if (!selectedVehicleId) {
        setLatestTelemetry(null);
        setEvaluations([]);
        setLatestResult(null);
        return;
      }

      setError(null);
      setLoadingTelemetry(true);
      setLoadingHistory(true);

      try {
        const [latestTelemetryData, history] = await Promise.all([
          fetchLatestTelemetry(selectedVehicleId),
          fetchHealthEvaluations(selectedVehicleId, 25),
        ]);

        setLatestTelemetry(latestTelemetryData);
        setEvaluations(history);
        setLatestResult(history[0] || null);
      } catch (loadError) {
        console.error('Error loading vehicle evaluation context:', loadError);
        setError('Unable to load telemetry/evaluation context for the selected vehicle.');
      } finally {
        setLoadingTelemetry(false);
        setLoadingHistory(false);
      }
    }

    loadVehicleContext();
  }, [selectedVehicleId]);

  const handleEvaluate = async () => {
    if (!selectedVehicleId) {
      setError('Select a vehicle before evaluating.');
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const result = await evaluateVehicleLive(selectedVehicleId);
      if (!result) {
        setError('Evaluation failed. Please try again.');
        return;
      }

      setLatestResult(result);

      const history = await fetchHealthEvaluations(selectedVehicleId, 25);
      setEvaluations(history);
    } catch (evalError) {
      console.error('Error evaluating vehicle health:', evalError);
      setError('Could not evaluate current telemetry for the selected vehicle.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loadingVehicles) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading evaluation workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            Live Evaluation
          </h1>
          <p className="text-sm text-muted-foreground">
            Evaluate a selected vehicle using its latest telemetry packet and persist the result.
          </p>
        </div>

        <div className="glass-card p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Selected Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="w-full bg-secondary/60 border border-border rounded px-3 py-2 text-sm text-foreground"
              >
                {vehicles.length === 0 ? (
                  <option value="">No vehicles available</option>
                ) : (
                  vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.vehicleId || vehicle.id}>
                      {vehicle.name} ({vehicle.plate})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={handleEvaluate}
              disabled={!selectedVehicleId || !latestTelemetry || evaluating || loadingTelemetry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4" />
              {evaluating ? 'Evaluating...' : 'Evaluate Latest Telemetry'}
            </button>
          </div>

          {selectedVehicle && (
            <div className="text-xs text-muted-foreground">
              Evaluations will run only for <span className="text-foreground font-medium">{selectedVehicle.name}</span>.
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Latest Telemetry Used For Evaluation
          </h3>

          {loadingTelemetry ? (
            <p className="text-sm text-muted-foreground">Loading latest telemetry...</p>
          ) : latestTelemetry ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 text-xs">
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Time</span><p className="text-sm text-foreground mt-1">{latestTelemetry.time}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Engine RPM</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.engineRpm, 0)}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Engine Temp</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.engineTemp, 1)} deg C</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Coolant Temp</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.coolantTemp, 1)} deg C</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Lub Oil Pressure</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.lubOilPressure, 2)} bar</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Battery Voltage</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.batteryVoltage, 2)} V</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Fuel Pressure</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.fuelPressure, 2)} psi</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Vibration</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.vibrationLevel, 2)}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Fuel Efficiency</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.fuelEfficiency, 2)} km/L</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Speed</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.speed, 1)} km/h</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Error Codes</span><p className="text-sm text-foreground mt-1">{formatValue(latestTelemetry.errorCodesCount, 0)}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Source</span><p className="text-sm text-foreground mt-1">{latestTelemetry.source || '--'}</p></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No live telemetry found for the selected vehicle. Start simulator/ingest first.
            </p>
          )}
        </div>

        {latestResult && (
          <div className="glass-card p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">Latest Evaluation Result</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Evaluated {new Date(latestResult.evaluatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{Math.round(latestResult.overallHealth)}%</span>
                <span className={`px-2 py-1 rounded text-xs border ${statusClassMap[latestResult.status] || 'text-muted-foreground border-border'}`}>
                  {latestResult.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 text-xs">
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Risk Level</span><p className={`text-sm mt-1 font-medium ${riskClassMap[latestResult.riskLevel] || 'text-foreground'}`}>{latestResult.riskLevel}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Failure Probability</span><p className="text-sm text-foreground mt-1">{formatValue((latestResult.failureProbability || 0) * 100, 1)}%</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Confidence</span><p className="text-sm text-foreground mt-1">{formatValue((latestResult.confidenceScore || 0) * 100, 1)}%</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Predicted Failure</span><p className="text-sm text-foreground mt-1">{latestResult.predictedFailureDays} days</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Model</span><p className="text-sm text-foreground mt-1">{latestResult.modelVersion}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Source</span><p className="text-sm text-foreground mt-1">{latestResult.source || '--'}</p></div>
            </div>

            {latestResult.components && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Component Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(latestResult.components).map(([component, score]) => (
                    <div key={component} className="rounded bg-secondary/40 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{component}</div>
                      <div className="text-base font-semibold text-foreground mt-1">{Math.round(score)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestResult.diagnosticAnalysis && (
              <div className="rounded border border-border/60 bg-secondary/20 px-3 py-2">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Diagnostic Analysis
                </h4>
                <p className="text-sm text-foreground whitespace-pre-line">{latestResult.diagnosticAnalysis}</p>
              </div>
            )}

            {latestResult.recommendations && latestResult.recommendations.length > 0 && (
              <div className="rounded border border-border/60 bg-secondary/20 px-3 py-2">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" /> Recommendations
                </h4>
                <ul className="space-y-1 text-sm text-foreground">
                  {latestResult.recommendations.map((recommendation, idx) => (
                    <li key={`${recommendation}-${idx}`} className="leading-relaxed">- {recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="glass-card p-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
            Evaluation History For Selected Vehicle
          </h3>

          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading evaluation history...</p>
          ) : evaluations.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[900px] text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/60">
                    <th className="py-2 pr-3 font-medium">Evaluated At</th>
                    <th className="py-2 pr-3 font-medium">Health</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Risk</th>
                    <th className="py-2 pr-3 font-medium">Failure Probability</th>
                    <th className="py-2 pr-3 font-medium">Predicted Failure Days</th>
                    <th className="py-2 pr-3 font-medium">Confidence</th>
                    <th className="py-2 font-medium">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.predictionId} className="border-b border-border/40 text-foreground">
                      <td className="py-2 pr-3">{new Date(evaluation.evaluatedAt).toLocaleString()}</td>
                      <td className="py-2 pr-3 font-medium">{Math.round(evaluation.overallHealth)}%</td>
                      <td className="py-2 pr-3">{evaluation.status}</td>
                      <td className="py-2 pr-3">{evaluation.riskLevel}</td>
                      <td className="py-2 pr-3">{formatValue((evaluation.failureProbability || 0) * 100, 1)}%</td>
                      <td className="py-2 pr-3">{evaluation.predictedFailureDays}</td>
                      <td className="py-2 pr-3">{formatValue((evaluation.confidenceScore || 0) * 100, 1)}%</td>
                      <td className="py-2">{evaluation.modelVersion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evaluations found for this vehicle yet. Click "Evaluate Latest Telemetry" to create one.
            </p>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
