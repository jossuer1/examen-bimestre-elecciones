import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { VeedorOpcion } from '../../../shared/models/vistas.model';

@Injectable({ providedIn: 'root' })
export class PerfilesRepository {
  private readonly sb = inject(SupabaseClientService).client;

  /** RLS ya limita el resultado a los veedores del recinto de quien consulta. */
  async listarVeedores(): Promise<VeedorOpcion[]> {
    const { data, error } = await this.sb
      .from('perfiles')
      .select('id, cedula, nombres, apellidos')
      .eq('rol', 'veedor')
      .order('apellidos');
    if (error) throw error;
    return (data ?? []) as VeedorOpcion[];
  }
}
