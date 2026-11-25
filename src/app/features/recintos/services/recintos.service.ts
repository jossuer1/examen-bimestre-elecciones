import { Injectable, inject } from '@angular/core';

import { MAX_JRV } from '../../../shared/models/constantes';
import type { Parroquia } from '../../../shared/models/geografia.model';
import type { NuevoRecinto, RecintoResumen } from '../../../shared/models/vistas.model';
import { GeografiaRepository } from '../data-access/geografia.repository';
import { RecintosRepository } from '../data-access/recintos.repository';

@Injectable({ providedIn: 'root' })
export class RecintosService {
  private readonly repo = inject(RecintosRepository);
  private readonly geografia = inject(GeografiaRepository);

  listar(): Promise<RecintoResumen[]> {
    return this.repo.listarResumen();
  }

  listarParroquias(): Promise<Parroquia[]> {
    return this.geografia.listarParroquias();
  }

  async crear(datos: NuevoRecinto): Promise<void> {
    if (!Number.isInteger(datos.parroquia_id) || datos.parroquia_id < 1) {
      throw new Error('Selecciona una parroquia válida.');
    }
    const nombre = datos.nombre.trim();
    if (nombre.length < 3) {
      throw new Error('El nombre del recinto es muy corto.');
    }
    if (!Number.isInteger(datos.cantidad_jrv) || datos.cantidad_jrv < 1 || datos.cantidad_jrv > MAX_JRV) {
      throw new Error(`La cantidad de JRV debe estar entre 1 y ${MAX_JRV}.`);
    }
    await this.repo.crear({ ...datos, nombre });
  }
}
