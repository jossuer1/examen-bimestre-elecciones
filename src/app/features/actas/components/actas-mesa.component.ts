import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal, type OnInit } from '@angular/core';
import { IonButton, IonCard, IonIcon, IonSkeletonText } from '@ionic/angular';

import type { ActaMesa, CambioActa, EdicionActa } from '../models/acta.model';
import { ActasService } from '../services/actas.service';
import { FormularioActaComponent } from './formulario-acta.component';

const etiquetas: Record<string, string> = {
  sufragantes: 'Sufragantes',
  blancos: 'Votos blancos',
  nulos: 'Votos nulos',
};

@Component({
  selector: 'app-actas-mesa',
  imports: [DatePipe, FormularioActaComponent, IonButton, IonCard, IonIcon, IonSkeletonText],
  template: `
    <div class="ce-card-stack">
    @if (aviso()) {
      <p class="ce-alert ce-alert--success" role="status">{{ aviso() }}</p>
    }
    @if (cargando()) {
      <ion-card class="ce-card ce-skeleton" role="status" aria-label="Cargando actas"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
    } @else if (error()) {
      <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
        <p role="alert">No se pudieron cargar las actas de esta mesa.</p>
        <ion-button fill="outline" (click)="cargar()">Reintentar</ion-button>
      </div>
    } @else if (actaSeleccionada(); as acta) {
      <ion-card class="ce-card">
      <div class="ce-card-top ce-acta-heading"><ion-icon name="document-text-outline" aria-hidden="true" /><h2>{{ acta.cargo === 'alcalde' ? 'Alcalde' : 'Prefecto' }}</h2></div>
      <button class="ce-back-link" type="button" [disabled]="ocupado()" (click)="seleccionar(null)">
        <ion-icon name="arrow-back-outline" aria-hidden="true" /> Volver a las actas
      </button>
      <p>{{ acta.sufragantes }} sufragantes · {{ acta.blancos }} blancos · {{ acta.nulos }} nulos</p>
      @if (cargandoFoto()) {
        <p role="status">Cargando fotografía…</p>
      }
      @if (errorFoto()) {
        <p role="alert">No se pudo mostrar la fotografía del acta.</p>
      }
      @if (fotoUrl(); as url) {
        <img class="ce-photo" [src]="url" alt="Fotografía del acta" referrerpolicy="no-referrer"
          (load)="cargandoFoto.set(false)" (error)="falloFoto()" />
        @if (!cargandoFoto()) {
          <ion-button fill="clear" (click)="fotoUrl.set('')">Ocultar fotografía</ion-button>
        }
      } @else if (!cargandoFoto()) {
        <ion-button fill="outline" [disabled]="ocupado()" (click)="verFoto(acta)">
          {{ errorFoto() ? 'Reintentar fotografía' : 'Ver fotografía' }}
        </ion-button>
      }

      </ion-card>
      @if (editando()) {
        <app-formulario-acta
          [mesaId]="mesaId()" [cargo]="acta.cargo" [edicion]="acta"
          (ocupacion)="cambiarOcupacion($event)" (guardada)="alGuardar()"
        />
        <ion-button fill="clear" [disabled]="ocupado()" (click)="editando.set(false)">Cancelar edición</ion-button>
      } @else {
        <ion-button (click)="editando.set(true)">Editar acta</ion-button>
      }

      <ion-card class="ce-card">
      <h3>Historial de ediciones</h3>
      @for (edicion of acta.ediciones; track edicion.id) {
        <p>
          {{ edicion.autor ? edicion.autor.nombres + ' ' + edicion.autor.apellidos : 'Autor no disponible' }}
          · {{ edicion.editada_en | date: 'dd/MM/yyyy HH:mm' }}
        </p>
        <ul>
          @for (cambio of describirCambios(edicion); track cambio) {
            <li>{{ cambio }}</li>
          }
        </ul>
      } @empty {
        <p>Esta acta aún no tiene ediciones.</p>
      }
      </ion-card>
    } @else {
      @for (acta of actas(); track acta.id) {
        <ion-card class="ce-card"><ion-button expand="block" fill="outline" (click)="seleccionar(acta.id)">
          <ion-icon slot="start" name="document-text-outline" aria-hidden="true" />
          Ver acta de {{ acta.cargo === 'alcalde' ? 'alcalde' : 'prefecto' }}
        </ion-button></ion-card>
      } @empty {
        <div class="ce-state"><ion-icon name="archive-outline" aria-hidden="true" /><p>Esta mesa aún no tiene actas registradas.</p></div>
      }
    }
    </div>
  `,
})
export class ActasMesaComponent implements OnInit {
  private readonly servicio = inject(ActasService);
  readonly mesaId = input.required<number>();
  readonly ocupacion = output<boolean>();
  readonly actas = signal<ActaMesa[]>([]);
  readonly seleccion = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly aviso = signal('');
  readonly editando = signal(false);
  readonly ocupado = signal(false);
  readonly fotoUrl = signal('');
  readonly cargandoFoto = signal(false);
  readonly errorFoto = signal(false);

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.error.set(false);
    this.cargando.set(true);
    try {
      this.actas.set(await this.servicio.listarPorMesa(this.mesaId()));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  actaSeleccionada(): ActaMesa | undefined {
    return this.actas().find((acta) => acta.id === this.seleccion());
  }

  seleccionar(id: number | null): void {
    this.seleccion.set(id);
    this.editando.set(false);
    this.fotoUrl.set('');
    this.cargandoFoto.set(false);
    this.errorFoto.set(false);
    this.aviso.set('');
  }

  async verFoto(acta: ActaMesa): Promise<void> {
    this.cargandoFoto.set(true);
    this.errorFoto.set(false);
    try {
      const url = await this.servicio.foto(acta.id);
      if (this.actaSeleccionada() === acta) this.fotoUrl.set(url);
    } catch {
      if (this.actaSeleccionada() === acta) this.falloFoto();
    }
  }

  falloFoto(): void {
    this.fotoUrl.set('');
    this.cargandoFoto.set(false);
    this.errorFoto.set(true);
  }

  cambiarOcupacion(ocupado: boolean): void {
    this.ocupado.set(ocupado);
    this.ocupacion.emit(ocupado);
  }

  async alGuardar(): Promise<void> {
    this.seleccionar(this.seleccion());
    this.aviso.set('Acta guardada.');
    await this.cargar();
  }

  describirCambios(edicion: EdicionActa): string[] {
    const detalle = (campo: string, cambio: CambioActa) =>
      `${campo}: ${cambio.antes ?? 'Sin registro'} → ${cambio.despues ?? 'Sin registro'}`;
    return Object.entries(edicion.cambios).flatMap(([campo, cambio]) => {
      if (campo === 'foto_url') return ['Fotografía reemplazada'];
      if (campo === 'votos') {
        return Object.entries(cambio as Record<string, CambioActa>)
          .map(([id, voto]) => detalle(`Votos de la candidatura ${id}`, voto));
      }
      return [detalle(etiquetas[campo] ?? campo, cambio as CambioActa)];
    });
  }
}
