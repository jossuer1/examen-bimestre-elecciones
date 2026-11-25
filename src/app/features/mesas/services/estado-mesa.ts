import type { EstadoMesa } from '../../../shared/models/electoral.model';

// Las actas mandan: si ya hay actas, el estado depende de cuántas hay
export function calcularEstado(veedorId: string | null, actas: number): EstadoMesa {
  if (actas >= 2) return 'completa';
  if (actas === 1) return 'acta_parcial';
  return veedorId ? 'asignada' : 'sin_asignar';
}
