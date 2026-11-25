import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { Cargo } from '../../../shared/models/electoral.model';
import type { ActaMesa, ConteoActa, RegistroActa } from '../models/acta.model';

@Injectable({ providedIn: 'root' })
export class ActasRepository {
  private readonly sb = inject(SupabaseClientService).client;

  async listarCandidaturas(cargo: Cargo): Promise<{ id: number; candidato: string }[]> {
    const { data, error } = await this.sb.from('candidaturas').select('id, candidato').eq('cargo', cargo).order('id');
    if (error) throw error;
    return data;
  }

  async registrar(acta: RegistroActa, foto: Blob): Promise<void> {
    const body = new FormData();
    body.set('acta', JSON.stringify(acta));
    body.set('foto', foto, 'acta');
    await this.invocar('registrar-acta', body);
  }

  async listarPorMesa(mesaId: number): Promise<ActaMesa[]> {
    const { data, error } = await this.sb.from('actas')
      .select('id, cargo, sufragantes, blancos, nulos, votos:acta_votos(candidatura_id,votos), ediciones:acta_ediciones(id,editada_en,cambios,autor:perfiles!editada_por(nombres,apellidos))')
      .eq('mesa_id', mesaId)
      .order('cargo')
      .returns<ActaMesa[]>();
    if (error) throw error;
    return data;
  }

  async foto(actaId: number): Promise<string> {
    const data = await this.invocar<{ url: string }>('foto-url', { acta_id: actaId });
    if (!data?.url) throw new Error('No se pudo obtener la fotografía del acta.');
    return data.url;
  }

  async corregir(actaId: number, conteo: ConteoActa, foto: Blob | null): Promise<void> {
    if (foto) {
      const body = new FormData();
      body.set('acta_id', String(actaId));
      body.set('correccion', JSON.stringify(conteo));
      body.set('foto', foto, 'acta');
      await this.invocar('corregir-acta', body);
      return;
    }

    const { error } = await this.sb.rpc('corregir_acta', {
      p_acta_id: actaId,
      p_nulos: conteo.nulos,
      p_blancos: conteo.blancos,
      p_sufragantes: conteo.sufragantes,
      p_votos: conteo.votos,
    });
    if (error?.code === '42501') throw new Error('Solo puedes corregir actas de tu recinto.');
    if (error?.code === '23514') throw new Error(error.message);
    if (error) throw new Error('No se pudo corregir el acta. Inténtalo de nuevo.');
  }

  private async invocar<T>(funcion: string, body: FormData | Record<string, unknown>): Promise<T | null> {
    const { data, error } = await this.sb.functions.invoke<T>(funcion, { body });
    if (!error) return data;

    const contexto = (error as { context?: unknown }).context;
    const respuesta = contexto instanceof Response ? await contexto.json().catch(() => null) : null;
    throw new Error(typeof respuesta?.error === 'string' ? respuesta.error : 'No se pudo completar la operación del acta.');
  }
}
