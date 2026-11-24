import { Injectable, inject } from '@angular/core';

import { RecintosRepository } from '../data-access/recintos.repository';
import type { RecintoResumen } from '../models/vistas.model';

@Injectable({ providedIn: 'root' })
export class RecintosService {
  private readonly repo = inject(RecintosRepository);

  listar(): Promise<RecintoResumen[]> {
    return this.repo.listarResumen();
  }
}
