import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { MesaFila, MesaVeedor } from '../../../shared/models/vistas.model';

@Injectable({ providedIn: 'root' })
export class MesasRepository {
  private readonly sb = inject(SupabaseClientService).client;

  async listarAsignadas(veedorId: string): Promise<MesaVeedor[]> {
    const { data, error } = await this.sb
      .from('mesas')
      .select('id, numero, actas(cargo)')
      .eq('veedor_id', veedorId)
      .order('numero')
      .returns<MesaVeedor[]>();
    if (error) throw error;
    return data ?? [];
  }

  async listarPorRecinto(recintoId: number): Promise<MesaFila[]> {
    const { data, error } = await this.sb
      .from('mesas')
      .select('id, numero, veedor_id, veedor:perfiles!veedor_id(nombres, apellidos), actas(id)')
      .eq('recinto_id', recintoId)
      .order('numero');
    if (error) throw error;
    return (data ?? []) as unknown as MesaFila[];
  }

  /** veedorId = null quita al veedor de la mesa. */
  async asignarVeedor(mesaId: number, veedorId: string | null): Promise<void> {
    const { data, error } = await this.sb.from('mesas').update({ veedor_id: veedorId }).eq('id', mesaId).select('id');
    if (error) throw error;
    // Si una política RLS bloquea el cambio, Supabase NO da error: devuelve 0 filas
    if (!data || data.length === 0) {
      throw new Error('No tienes permiso para modificar esta mesa.');
    }
  }
}
