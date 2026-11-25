import { Injectable, inject } from '@angular/core';

import type { Perfil } from '../../shared/models/perfil.model';
import { SupabaseClientService } from '../services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly sb = inject(SupabaseClientService).client;

  async buscarCorreo(cedula: string): Promise<string | null> {
    const { data, error } = await this.sb.rpc('email_por_cedula', { p_cedula: cedula });
    if (error) throw error;
    return typeof data === 'string' && data ? data : null;
  }

  async iniciarSesion(correo: string, clave: string): Promise<string> {
    const { data, error } = await this.sb.auth.signInWithPassword({ email: correo, password: clave });
    if (error) throw error;
    return data.user.id;
  }

  async completarEnlaceConfirmacion(enlace: string): Promise<string> {
    const url = new URL(enlace);
    const parametros = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
    const accessToken = parametros.get('access_token');
    const refreshToken = parametros.get('refresh_token');
    const codigo = url.searchParams.get('code');
    const respuesta = accessToken && refreshToken
      ? await this.sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      : codigo
        ? await this.sb.auth.exchangeCodeForSession(codigo)
        : { data: { user: null }, error: new Error('El enlace no contiene una sesión válida.') };
    if (respuesta.error || !respuesta.data.user) throw respuesta.error ?? new Error('No se pudo confirmar la cuenta.');
    return respuesta.data.user.id;
  }

  async usuarioActual(): Promise<string | null> {
    const { data, error } = await this.sb.auth.getSession();
    if (error) throw error;
    return data.session?.user.id ?? null;
  }

  async actualizarClave(clave: string): Promise<void> {
    const { error } = await this.sb.auth.updateUser({ password: clave });
    if (error) throw error;
  }

  async enviarCodigoRecuperacion(correo: string): Promise<void> {
    const { error } = await this.sb.auth.resetPasswordForEmail(correo);
    if (error) throw error;
  }

  async verificarCodigoRecuperacion(correo: string, codigo: string): Promise<string> {
    const { data, error } = await this.sb.auth.verifyOtp({ email: correo, token: codigo, type: 'recovery' });
    if (error) throw error;
    if (!data.session) throw new Error('No se inició la sesión de recuperación.');
    return data.session.user.id;
  }

  async cerrarSesion(): Promise<void> {
    const { error } = await this.sb.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  async cargarPerfil(id: string): Promise<Perfil> {
    const { data, error } = await this.sb.from('perfiles').select('*').eq('id', id).single<Perfil>();
    if (error) throw error;
    return data;
  }
}
