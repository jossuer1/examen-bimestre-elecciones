import type { Cargo, EstadoMesa, Recinto } from './electoral.model';

export type NuevoRecinto = Pick<Recinto, 'parroquia_id' | 'nombre' | 'cantidad_jrv'>;

export interface NuevoUsuario {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
}

export interface RecintoResumen {
  id: number;
  nombre: string;
  cantidad_jrv: number;
  parroquia: string;
  coordinador: string | null;
}

export interface MesaFila {
  id: number;
  numero: number;
  veedor_id: string | null;
  veedor: { nombres: string; apellidos: string } | null;
  actas: { id: number }[];
}

export interface MesaResumen {
  id: number;
  numero: number;
  veedor_id: string | null;
  veedor: string | null;
  actas: number;
  estado: EstadoMesa;
}

export interface VeedorOpcion {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
}

export interface MesaVeedor {
  id: number;
  numero: number;
  actas: { cargo: Cargo }[];
}
