export type Rol = 'provincial' | 'recinto' | 'veedor';

export interface Perfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: Rol;
  recinto_id: number | null;
  debe_cambiar_clave: boolean;
}