import type { Cargo } from '../../../shared/models/electoral.model';

export interface ConteoActa {
  sufragantes: number;
  blancos: number;
  nulos: number;
  votos: { candidatura_id: number; votos: number }[];
}

export interface RegistroActa extends ConteoActa {
  mesa_id: number;
  cargo: Cargo;
  gps_lat: number;
  gps_lng: number;
}

export interface CambioActa {
  antes: number | string | null;
  despues: number | string | null;
}

export interface EdicionActa {
  id: number;
  editada_en: string;
  autor: { nombres: string; apellidos: string } | null;
  cambios: Record<string, CambioActa | Record<string, CambioActa>>;
}

export interface ActaMesa extends ConteoActa {
  id: number;
  cargo: Cargo;
  ediciones: EdicionActa[];
}
