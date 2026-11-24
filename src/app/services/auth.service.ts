import { Injectable, inject } from '@angular/core';

import { SupabaseClientService } from '../data-access/supabase-client.service';
import type { Perfil } from '../models/perfil.model';

export function rutaDePerfil(perfil: Perfil): string {
  if (perfil.debe_cambiar_clave) return '/cambiar-clave';
  return perfil.rol === 'provincial' ? '/provincial' : '/bienvenida';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseClientService).client;

  async iniciarSesion(cedula: string, clave: string): Promise<Perfil> {
    const { data: correo, error: errorCorreo } = await this.sb.rpc('email_por_cedula', {
      p_cedula: cedula.trim(),
    });
    if (errorCorreo) throw new Error('No se pudo consultar el acceso. Inténtalo de nuevo.');
    if (typeof correo !== 'string' || !correo) throw new Error('Cédula o clave incorrecta.');

    const { data, error } = await this.sb.auth.signInWithPassword({ email: correo, password: clave });
    if (error?.code === 'email_not_confirmed') {
      throw new Error('Debes confirmar tu cuenta con el enlace que enviamos a tu correo.');
    }
    if (error?.code === 'invalid_credentials') throw new Error('Cédula o clave incorrecta.');
    if (error) throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');
    return this.cargarPerfil(data.user.id);
  }

  async perfilActual(): Promise<Perfil | null> {
    const { data, error } = await this.sb.auth.getSession();
    if (error) throw error;
    return data.session ? this.cargarPerfil(data.session.user.id) : null;
  }

  async cambiarClave(clave: string): Promise<void> {
    const { error } = await this.sb.auth.updateUser({ password: clave });
    if (error?.code === 'same_password') throw new Error('Elige una clave diferente a la actual.');
    if (error) throw error;

    const { error: errorRegistro } = await this.sb.rpc('marcar_clave_cambiada');
    if (errorRegistro) throw new Error('Se cambió la clave, pero no se pudo actualizar el perfil.');
  }

  async cerrarSesion(): Promise<void> {
    const { error } = await this.sb.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  private async cargarPerfil(id: string): Promise<Perfil> {
    const { data, error } = await this.sb.from('perfiles').select('*').eq('id', id).single<Perfil>();
    if (error) throw new Error('No se pudo cargar tu perfil.');
    return data;
  }
}
