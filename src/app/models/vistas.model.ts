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