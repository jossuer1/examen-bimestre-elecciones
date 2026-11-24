import { Injectable, inject } from '@angular/core';

import { UsuariosRepository } from '../data-access/usuarios.repository';
import type { NuevoUsuario } from '../models/vistas.model';
import { esCedulaValida } from '../validators/cedula.validator';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly repo = inject(UsuariosRepository);

  /** El provincial crea al coordinador de un recinto. Devuelve si se envió el correo. */
  crearCoordinador(recintoId: number, datos: NuevoUsuario): Promise<boolean> {
    this.validar(datos);
    return this.repo.crear(datos, recintoId);
  }

  /** El coordinador de recinto crea veedores (el recinto lo decide el servidor). */
  crearVeedor(datos: NuevoUsuario): Promise<boolean> {
    this.validar(datos);
    return this.repo.crear(datos, null);
  }

  // Segunda validación (ADR-006): el servicio no confía en el formulario
  private validar(d: NuevoUsuario): void {
    if (!esCedulaValida(d.cedula)) throw new Error('La cédula no es válida.');
  }
}
