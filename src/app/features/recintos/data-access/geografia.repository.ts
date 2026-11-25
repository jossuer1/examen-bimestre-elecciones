import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { Parroquia } from '../../../shared/models/geografia.model';

@Injectable({ providedIn: 'root' })
export class GeografiaRepository {
  private readonly sb = inject(SupabaseClientService).client;

  async listarParroquias(): Promise<Parroquia[]> {
    const { data, error } = await this.sb.from('parroquias').select('id, canton_id, nombre').order('nombre');
    if (error) throw error;
    return (data ?? []) as Parroquia[];
  }
}
