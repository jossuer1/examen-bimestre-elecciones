import { Injectable, inject } from '@angular/core';

import type { Cargo } from '../../../shared/models/electoral.model';
import { DashboardRepository } from '../data-access/dashboard.repository';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly repo = inject(DashboardRepository);

  avance() {
    return this.repo.avance().catch(() => {
      throw new Error('No se pudo cargar el avance de los recintos.');
    });
  }

  async resultados(cargo: Cargo, recintoId: number | null) {
    const resultados = await this.repo.resultados(cargo, recintoId).catch(() => {
      throw new Error('No se pudieron cargar los resultados.');
    });
    return resultados.sort((a, b) => b.votos - a.votos || a.candidatura_id - b.candidatura_id);
  }

  async actasGps() {
    const actas = await this.repo.actasGps().catch(() => {
      throw new Error('No se pudieron cargar las ubicaciones de las actas.');
    });
    return actas.reverse().map((acta) => ({
      ...acta,
      enlaceMapa: acta.gps_lat === null || acta.gps_lng === null
        ? null
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${acta.gps_lat},${acta.gps_lng}`)}`,
    }));
  }
}
