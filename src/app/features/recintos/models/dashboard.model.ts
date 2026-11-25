import type { Cargo } from '../../../shared/models/electoral.model';

export interface AvanceRecinto {
  id: number;
  nombre: string;
  parroquia: string;
  total_mesas: number;
  actas_registradas: number;
  actas_esperadas: number;
  porcentaje: number;
}

export interface ResultadoVotos {
  candidatura_id: number;
  organizacion: string;
  candidato: string;
  votos: number;
}

export interface ActaGps {
  acta_id: number;
  recinto: string;
  mesa: number;
  cargo: Cargo;
  gps_lat: number | null;
  gps_lng: number | null;
  creada_en: string;
  veedor: string;
}
