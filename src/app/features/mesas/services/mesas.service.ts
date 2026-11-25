import { Injectable, inject } from '@angular/core';

import type { MesaResumen, MesaVeedor, VeedorOpcion } from '../../../shared/models/vistas.model';
import { PerfilesRepository } from '../../usuarios/data-access/perfiles.repository';
import { MesasRepository } from '../data-access/mesas.repository';

import { calcularEstado } from './estado-mesa';

@Injectable({ providedIn: 'root' })
export class MesasService {
  private readonly mesas = inject(MesasRepository);
  private readonly perfiles = inject(PerfilesRepository);

  listarAsignadas(veedorId: string): Promise<MesaVeedor[]> {
    return this.mesas.listarAsignadas(veedorId);
  }

  async listar(recintoId: number): Promise<MesaResumen[]> {
    const filas = await this.mesas.listarPorRecinto(recintoId);
    return filas.map((f) => ({
      id: f.id,
      numero: f.numero,
      veedor_id: f.veedor_id,
      veedor: f.veedor ? `${f.veedor.nombres} ${f.veedor.apellidos}` : null,
      actas: f.actas.length,
      estado: calcularEstado(f.veedor_id, f.actas.length),
    }));
  }

  listarVeedores(): Promise<VeedorOpcion[]> {
    return this.perfiles.listarVeedores();
  }

  asignar(mesaId: number, veedorId: string | null): Promise<void> {
    return this.mesas.asignarVeedor(mesaId, veedorId);
  }
}
