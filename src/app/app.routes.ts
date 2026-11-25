import type { Routes } from '@angular/router';

import { comprobarAcceso } from './core/routing/acceso.resolver';

export const routes: Routes = [
  {
    path: 'acceso',
    resolve: { perfil: comprobarAcceso('/acceso') },
    loadComponent: () => import('./features/auth/acceso.page').then((m) => m.AccesoPage),
  },
  {
    path: 'cambiar-clave',
    resolve: { perfil: comprobarAcceso('/cambiar-clave') },
    loadComponent: () => import('./features/auth/acceso.page').then((m) => m.AccesoPage),
  },
  {
    path: 'provincial',
    resolve: { perfil: comprobarAcceso('/provincial') },
    loadComponent: () => import('./features/recintos/provincial.page').then((m) => m.ProvincialPage),
  },
  {
    path: 'recinto',
    resolve: { perfil: comprobarAcceso('/recinto') },
    loadComponent: () => import('./features/mesas/recinto.page').then((m) => m.RecintoPage),
  },
  {
    path: 'veedor',
    resolve: { perfil: comprobarAcceso('/veedor') },
    loadComponent: () => import('./features/actas/veedor.page').then((m) => m.VeedorPage),
  },
  { path: 'bienvenida', redirectTo: 'veedor', pathMatch: 'full' },
  { path: 'home', redirectTo: 'acceso', pathMatch: 'full' },
  { path: '', redirectTo: 'acceso', pathMatch: 'full' },
];
