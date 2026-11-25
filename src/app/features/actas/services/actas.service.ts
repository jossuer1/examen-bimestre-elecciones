import { Injectable, inject } from '@angular/core';

import type { Cargo } from '../../../shared/models/electoral.model';
import { ActasRepository } from '../data-access/actas.repository';
import type { ConteoActa, RegistroActa } from '../models/acta.model';

@Injectable({ providedIn: 'root' })
export class ActasService {
  private readonly repo = inject(ActasRepository);

  candidaturas(cargo: Cargo) {
    return this.repo.listarCandidaturas(cargo);
  }

  async listarPorMesa(mesaId: number) {
    const actas = await this.repo.listarPorMesa(mesaId);
    for (const acta of actas) {
      acta.ediciones.sort((a, b) => b.editada_en.localeCompare(a.editada_en) || b.id - a.id);
    }
    return actas;
  }

  foto(actaId: number): Promise<string> {
    return this.repo.foto(actaId);
  }

  registrar(
    acta: Omit<RegistroActa, 'gps_lat' | 'gps_lng'>,
    foto: Blob | null,
    ubicacion: { latitude: number; longitude: number } | null,
  ): Promise<void> {
    this.validarCuadre(acta);
    if (!foto) throw new Error('Toma o adjunta una foto legible de la hoja antes de guardar.');
    if (!ubicacion) throw new Error('Obtén tu ubicación antes de guardar el acta.');
    return this.repo.registrar({ ...acta, gps_lat: ubicacion.latitude, gps_lng: ubicacion.longitude }, foto);
  }

  corregir(actaId: number, conteo: ConteoActa, foto: Blob | null): Promise<void> {
    this.validarCuadre(conteo);
    return this.repo.corregir(actaId, conteo, foto);
  }

  private validarCuadre({ votos, blancos, nulos, sufragantes }: ConteoActa): void {
    if (votos.reduce((total, voto) => total + voto.votos, blancos + nulos) !== sufragantes) {
      throw new Error('Los votos por candidatura, blancos y nulos deben sumar los sufragantes.');
    }
  }
}
