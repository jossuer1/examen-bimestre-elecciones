export interface Provincia { id: number; nombre: string; }
export interface Canton { id: number; provincia_id: number; nombre: string; }
export interface Parroquia { id: number; canton_id: number; nombre: string; }