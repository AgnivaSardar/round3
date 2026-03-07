import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CarFront, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { createVehicle } from '@/services/api';
import type { CreateVehiclePayload } from '@/services/api';

const fuelTypeOptions = [
  'PETROL',
  'DIESEL',
  'ELECTRIC',
  'HYBRID',
  'PLUG_IN_HYBRID',
  'CNG',
  'LPG',
  'HYDROGEN',
] as const;

const vehicleTypeOptions = [
  'SEDAN',
  'HATCHBACK',
  'SUV',
  'COUPE',
  'CONVERTIBLE',
  'WAGON',
  'MINIVAN',
  'MOTORCYCLE',
  'PICKUP_TRUCK',
  'LIGHT_TRUCK',
  'HEAVY_TRUCK',
  'BUS',
  'DELIVERY_VAN',
  'FLEET_VEHICLE',
] as const;

const engineTypeOptions = ['INLINE', 'V_TYPE', 'BOXER', 'ROTARY', 'ELECTRIC_MOTOR'] as const;
const statusOptions = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'] as const;

interface VehicleFormState {
  userId: string;
  vehicleNumber: string;
  manufacturer: string;
  model: string;
  year: string;
  vehicleType: string;
  vin: string;
  engineType: string;
  fuelType: string;
  registrationDate: string;
  status: string;
}

const initialFormState: VehicleFormState = {
  userId: '',
  vehicleNumber: '',
  manufacturer: '',
  model: '',
  year: '',
  vehicleType: '',
  vin: '',
  engineType: '',
  fuelType: 'DIESEL',
  registrationDate: '',
  status: 'ACTIVE',
};

const normalizeEnumValue = (value: string): string => {
  return value.trim().toUpperCase().replace(/\s+/g, '_');
};

const safeTrim = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export default function AddVehiclePage() {
  const [form, setForm] = useState<VehicleFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdVehicleId, setCreatedVehicleId] = useState('');

  const canSubmit = useMemo(() => {
    return form.fuelType.trim().length > 0 && !submitting;
  }, [form.fuelType, submitting]);

  const updateField = (field: keyof VehicleFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setSuccess('');
    setCreatedVehicleId('');

    const parsedYear = Number(form.year);
    if (form.year.trim().length > 0 && (!Number.isFinite(parsedYear) || parsedYear < 1980 || parsedYear > 2100)) {
      setError('Year must be between 1980 and 2100.');
      return;
    }

    const payload: CreateVehiclePayload = {
      fuelType: normalizeEnumValue(form.fuelType),
    };

    const userId = safeTrim(form.userId);
    const vehicleNumber = safeTrim(form.vehicleNumber);
    const manufacturer = safeTrim(form.manufacturer);
    const model = safeTrim(form.model);
    const vehicleType = safeTrim(form.vehicleType);
    const vin = safeTrim(form.vin);
    const engineType = safeTrim(form.engineType);
    const registrationDate = safeTrim(form.registrationDate);
    const status = safeTrim(form.status);

    if (userId) payload.userId = userId;
    if (vehicleNumber) payload.vehicleNumber = vehicleNumber;
    if (manufacturer) payload.manufacturer = manufacturer;
    if (model) payload.model = model;
    if (vehicleType) payload.vehicleType = normalizeEnumValue(vehicleType);
    if (vin) payload.vin = vin;
    if (engineType) payload.engineType = normalizeEnumValue(engineType);
    if (registrationDate) payload.registrationDate = registrationDate;
    if (status) payload.status = normalizeEnumValue(status);
    if (form.year.trim().length > 0) payload.year = parsedYear;

    setSubmitting(true);
    try {
      const created = await createVehicle(payload);
      if (!created) {
        setError('Vehicle creation failed. Ensure backend supports POST /api/v1/vehicles and required values are valid.');
        return;
      }

      const createdId = created.vehicleId || created.id;
      if (createdId) {
        setCreatedVehicleId(createdId);
      }

      setSuccess('Vehicle added successfully.');
      setForm((prev) => ({
        ...initialFormState,
        userId: prev.userId,
        fuelType: prev.fuelType,
      }));
    } catch (submitError) {
      console.error('Failed to add vehicle:', submitError);
      setError('Something went wrong while creating the vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <CarFront className="h-6 w-6 text-primary" />
            Add New Vehicle
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register a new car for a user and add it to the fleet records.
          </p>
        </div>

        <div className="glass-card p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <label className="text-xs text-muted-foreground">
                User ID
                <input
                  value={form.userId}
                  onChange={(event) => updateField('userId', event.target.value)}
                  placeholder="Optional if backend auto-assigns"
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Plate / Vehicle Number
                <input
                  value={form.vehicleNumber}
                  onChange={(event) => updateField('vehicleNumber', event.target.value)}
                  placeholder="TN-01-AB-1234"
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Manufacturer
                <input
                  value={form.manufacturer}
                  onChange={(event) => updateField('manufacturer', event.target.value)}
                  placeholder="Tata / Ashok Leyland"
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Model
                <input
                  value={form.model}
                  onChange={(event) => updateField('model', event.target.value)}
                  placeholder="Signa / Ultra"
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Year
                <input
                  value={form.year}
                  onChange={(event) => updateField('year', event.target.value)}
                  placeholder="2024"
                  inputMode="numeric"
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                VIN
                <input
                  value={form.vin}
                  onChange={(event) => updateField('vin', event.target.value)}
                  placeholder="Vehicle identification number"
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Fuel Type
                <select
                  value={form.fuelType}
                  onChange={(event) => updateField('fuelType', event.target.value)}
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                >
                  {fuelTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-muted-foreground">
                Vehicle Type
                <select
                  value={form.vehicleType}
                  onChange={(event) => updateField('vehicleType', event.target.value)}
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select</option>
                  {vehicleTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-muted-foreground">
                Engine Type
                <select
                  value={form.engineType}
                  onChange={(event) => updateField('engineType', event.target.value)}
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select</option>
                  {engineTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-muted-foreground">
                Registration Date
                <input
                  type="date"
                  value={form.registrationDate}
                  onChange={(event) => updateField('registrationDate', event.target.value)}
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Status
                <select
                  value={form.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  className="mt-1 w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm text-foreground"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <div className="rounded border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded border border-success/40 bg-success/10 text-success px-3 py-2 text-sm flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? 'Adding vehicle...' : 'Add Vehicle'}
              </button>

              <Link
                to="/vehicles"
                className="px-4 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm"
              >
                Open Vehicles List
              </Link>

              {createdVehicleId && (
                <Link
                  to={`/vehicles/${createdVehicleId}`}
                  className="px-4 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm"
                >
                  Open Created Vehicle
                </Link>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
