import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { Cargo } from '../../../shared/models/electoral.model';
import type { ActaGps, AvanceRecinto, ResultadoVotos } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly sb = inject(SupabaseClientService).client;

  avance(): Promise<AvanceRecinto[]> {
    return this.listar<AvanceRecinto>('avance_recintos', 'id');
  }

  resultados(cargo: Cargo, recintoId: number | null): Promise<ResultadoVotos[]> {
    return this.listar<ResultadoVotos>('resultados_votos', 'candidatura_id', { p_cargo: cargo, p_recinto_id: recintoId });
  }

  actasGps(): Promise<ActaGps[]> {
    return this.listar<ActaGps>('actas_gps', 'acta_id');
  }

  private async listar<T>(funcion: string, columnaId: keyof T & string, args?: Record<string, unknown>): Promise<T[]> {
    const filas: T[] = [];
    const tamanoPagina = 200;
    for (let desde = 0; ; desde += tamanoPagina) {
      const { data, error } = await this.sb.rpc(funcion, args)
        .order(columnaId)
        .range(desde, desde + tamanoPagina - 1);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Respuesta de consulta inesperada.');
      filas.push(...(data as T[]));
      if (data.length < tamanoPagina) return filas;
    }
  }
}
