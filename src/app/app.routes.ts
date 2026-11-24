import { inject } from '@angular/core';
import { RedirectCommand, Router } from '@angular/router';
import type { ResolveFn, Routes } from '@angular/router';

import type { Perfil } from './models/perfil.model';
import { AuthService, rutaDePerfil } from './services/auth.service';

function comprobarAcceso(destino: string): ResolveFn<Perfil | null | 'error-perfil'> {
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

export const routes: Routes = [
  {
    path: 'acceso',
    resolve: { perfil: comprobarAcceso('/acceso') },
    loadComponent: () => import('./pages/acceso.page').then((m) => m.AccesoPage),
  },
  {
    path: 'cambiar-clave',
    resolve: { perfil: comprobarAcceso('/cambiar-clave') },
    loadComponent: () => import('./pages/acceso.page').then((m) => m.AccesoPage),
  },
  {
    path: 'provincial',
    resolve: { perfil: comprobarAcceso('/provincial') },
    loadComponent: () => import('./pages/provincial.page').then((m) => m.ProvincialPage),
  },
  {
    path: 'bienvenida',
    resolve: { perfil: comprobarAcceso('/bienvenida') },
    loadComponent: () => import('./pages/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  { path: 'home', redirectTo: 'acceso', pathMatch: 'full' },
  { path: '', redirectTo: 'acceso', pathMatch: 'full' },
];
