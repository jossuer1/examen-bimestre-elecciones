import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { NuevoRecinto, RecintoResumen } from '../../../shared/models/vistas.model';

interface FilaRecinto {
  id: number;
  nombre: string;
  cantidad_jrv: number;
  parroquias: { nombre: string } | null;
  coordinador: { nombres: string; apellidos: string } | null;
}

@Injectable({ providedIn: 'root' })
export class RecintosRepository {
  private readonly sb = inject(SupabaseClientService).client;

  async crear(datos: NuevoRecinto): Promise<void> {
    const { error } = await this.sb.from('recintos').insert(datos);
    if (error) throw error;
  }

  async listarResumen(): Promise<RecintoResumen[]> {
    // "perfiles!coordinador_id" indica por cuál columna unir (hay dos relaciones)
    const { data, error } = await this.sb
      .from('recintos')
      .select('id, nombre, cantidad_jrv, parroquias(nombre), coordinador:perfiles!coordinador_id(nombres, apellidos)')
      .order('id');
    if (error) throw error;

    return ((data ?? []) as unknown as FilaRecinto[]).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      cantidad_jrv: r.cantidad_jrv,
      parroquia: r.parroquias?.nombre ?? '',
      coordinador: r.coordinador ? `${r.coordinador.nombres} ${r.coordinador.apellidos}` : null,
    }));
  }
}
