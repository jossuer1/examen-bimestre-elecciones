import { Injectable, inject } from '@angular/core';

import type { Perfil } from '../../shared/models/perfil.model';
import { AuthRepository } from '../data-access/auth.repository';
import { esCedulaValida } from '../../shared/validators/cedula.validator';

export function esClaveRecuperacionValida(clave: string): boolean {
  return clave !== 'Ecuador2026' && clave.length >= 8 && /\p{L}/u.test(clave) && /[0-9]/.test(clave);
}

export const MENSAJE_CLAVE_RECUPERACION =
  'Usa al menos 8 caracteres, una letra y un número. Elige una clave distinta de la inicial.';

export function rutaDePerfil(perfil: Perfil): string {
  if (perfil.debe_cambiar_clave) return '/cambiar-clave';
  if (perfil.rol === 'provincial') return '/provincial';
  if (perfil.rol === 'recinto') return '/recinto';
  return '/veedor';
}

function codigoError(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo = inject(AuthRepository);
  private correoRecuperacion: string | null = null;
  private usuarioRecuperacion: string | null = null;

  async solicitarRecuperacion(cedula: string): Promise<void> {
    cedula = cedula.trim();
    if (!esCedulaValida(cedula)) throw new Error('Ingresa una cédula válida.');
    this.correoRecuperacion = null;
    try {
      this.correoRecuperacion = await this.repo.buscarCorreo(cedula);
      if (this.correoRecuperacion) await this.repo.enviarCodigoRecuperacion(this.correoRecuperacion);
    } catch {
      // La respuesta visible es la misma si no hay cuenta o falla el envío.
    }
  }

  async recuperarClave(codigo: string, clave: string): Promise<void> {
    if (!esClaveRecuperacionValida(clave)) throw new Error(MENSAJE_CLAVE_RECUPERACION);

    if (!this.usuarioRecuperacion) {
      const correo = this.correoRecuperacion;
      const errorCodigo = 'El código no es válido o caducó. Revísalo o solicita otro.';
      if (!correo || !/^\d+$/.test(codigo)) throw new Error(errorCodigo);
      try {
        this.usuarioRecuperacion = await this.repo.verificarCodigoRecuperacion(correo, codigo);
      } catch {
        throw new Error(errorCodigo);
      }
    }

    // Un fallo al guardar permite reintentar con la sesión ya verificada.
    const usuarioActual = await this.repo.usuarioActual().catch(() => {
      throw new Error('No se pudo consultar tu sesión. Inténtalo de nuevo.');
    });
    if (usuarioActual !== this.usuarioRecuperacion) {
      this.usuarioRecuperacion = null;
      throw new Error('La sesión de recuperación terminó. Solicita un código nuevo.');
    }
    await this.cambiarClave(clave);
    this.usuarioRecuperacion = null;
    this.correoRecuperacion = null;
  }

  async cancelarRecuperacion(): Promise<void> {
    if (this.usuarioRecuperacion) await this.cerrarSesion();
    this.usuarioRecuperacion = null;
    this.correoRecuperacion = null;
  }

  async iniciarSesion(cedula: string, clave: string): Promise<Perfil> {
    const correo = await this.repo.buscarCorreo(cedula.trim()).catch(() => {
      throw new Error('No se pudo consultar el acceso. Inténtalo de nuevo.');
    });
    if (!correo) throw new Error('Cédula o clave incorrecta.');

    const id = await this.repo.iniciarSesion(correo, clave).catch((error: unknown) => {
      const codigo = codigoError(error);
      if (codigo === 'email_not_confirmed') {
        throw new Error('Debes confirmar tu cuenta con el enlace que enviamos a tu correo.');
      }
      if (codigo === 'invalid_credentials') throw new Error('Cédula o clave incorrecta.');
      throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');
    });

    return this.cargarPerfil(id);
  }

  async completarConfirmacion(enlace: string): Promise<Perfil> {
    try {
      return await this.cargarPerfil(await this.repo.completarEnlaceConfirmacion(enlace));
    } catch {
      throw new Error('El enlace de confirmación no es válido o ya caducó. Solicita ayuda a tu coordinador.');
    }
  }

  async perfilActual(): Promise<Perfil | null> {
    const id = await this.repo.usuarioActual().catch(() => {
      throw new Error('No se pudo consultar tu sesión. Inténtalo de nuevo.');
    });
    return id ? this.cargarPerfil(id) : null;
  }

  async cambiarClave(clave: string): Promise<void> {
    try {
      await this.repo.actualizarClave(clave);
    } catch (error) {
      if (codigoError(error) === 'same_password') {
        throw new Error('Elige una clave diferente a la actual.');
      }
      if (codigoError(error) === 'weak_password') {
        throw new Error('Elige una clave más segura e inténtalo de nuevo.');
      }
      throw new Error('No se pudo cambiar tu clave. Inténtalo de nuevo.');
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.repo.cerrarSesion();
    } catch {
      throw new Error('No se pudo cerrar sesión. Inténtalo de nuevo.');
    }
  }

  private async cargarPerfil(id: string): Promise<Perfil> {
    try {
      return await this.repo.cargarPerfil(id);
    } catch {
      throw new Error('No se pudo cargar tu perfil.');
    }
  }
}
