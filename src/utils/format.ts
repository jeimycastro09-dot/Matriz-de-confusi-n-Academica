const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const intFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const percentFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCOP(amount: number): string {
  if (!Number.isFinite(amount)) {
    return 'No definido';
  }
  return `${copFormatter.format(Math.round(amount))} COP`;
}

export function formatCOPCompact(amount: number): string {
  if (!Number.isFinite(amount)) {
    return 'No definido';
  }
  return copFormatter.format(Math.round(amount));
}

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return intFormatter.format(Math.round(value));
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null || !Number.isFinite(ratio)) {
    return 'No definido';
  }
  return `${percentFormatter.format(ratio * 100)} %`;
}

export function formatDecimal(ratio: number | null): string {
  if (ratio === null || !Number.isFinite(ratio)) {
    return 'No definido';
  }
  return decimalFormatter.format(ratio);
}

export function sanitizeNonNegativeInt(raw: string | number): number {
  const parsed = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d-]/g, ''));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

export function sanitizeNonNegativeNumber(raw: string | number): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  }
  const normalized = raw.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}
