import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../../../core/services/supabase-client.service';
import type { NuevoUsuario } from '../../../shared/models/vistas.model';

@Injectable({ providedIn: 'root' })
export class UsuariosRepository {
  private readonly sb = inject(SupabaseClientService).client;

  async crear(datos: NuevoUsuario, recintoId: number | null): Promise<boolean> {
    const { data, error } = await this.sb.functions.invoke('crear-usuario', {
      body: { ...datos, recinto_id: recintoId },
    });

    if (error) {
      // La función devuelve { error: "mensaje" }; lo rescatamos de la respuesta
      let mensaje = 'No se pudo crear el usuario.';
      const contexto = (error as { context?: unknown }).context;
      if (contexto instanceof Response) {
        try {
          mensaje = (await contexto.json()).error ?? mensaje;
        } catch {
          /* sin detalle: se usa el mensaje genérico */
        }
      }
      throw new Error(mensaje);
    }
    return (data as { correo_enviado: boolean }).correo_enviado;
  }
}
