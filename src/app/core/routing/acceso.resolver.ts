import { inject } from '@angular/core';
import { RedirectCommand, Router } from '@angular/router';
import type { ResolveFn } from '@angular/router';

import type { Perfil } from '../../shared/models/perfil.model';
import { AuthService, rutaDePerfil } from '../services/auth.service';

export function comprobarAcceso(destino: string): ResolveFn<Perfil | null | 'error-perfil'> {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    let perfil: Perfil | null;
    try {
      perfil = await auth.perfilActual();
    } catch {
      if (destino === '/acceso') return 'error-perfil';
      return new RedirectCommand(router.parseUrl('/acceso'));
    }

    const ruta = perfil ? rutaDePerfil(perfil) : '/acceso';
    return ruta === destino ? perfil : new RedirectCommand(router.parseUrl(ruta));
  };
}
