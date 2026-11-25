import { DatePipe } from '@angular/common';
import { Component, inject, signal, type OnInit, type WritableSignal } from '@angular/core';
import { IonButton, IonCard, IonIcon, IonProgressBar, IonSkeletonText } from '@ionic/angular';

import { mensajeError } from '../../../core/errors/errores';
import type { Cargo } from '../../../shared/models/electoral.model';
import type { ActaGps, AvanceRecinto, ResultadoVotos } from '../models/dashboard.model';
import { DashboardService } from '../services/dashboard.service';

type Consulta<T> =
  | { estado: 'carga' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'exito'; filas: T[] };

@Component({
  selector: 'app-dashboard-provincial',
  imports: [DatePipe, IonButton, IonCard, IonIcon, IonProgressBar, IonSkeletonText],
  template: `
    <div class="ce-dashboard">
    <section>
      <div class="ce-section-heading"><ion-icon name="business-outline" aria-hidden="true" /><h2>Avance por recinto</h2></div>
      @let consultaAvance = avance();
      @if (consultaAvance.estado === 'carga') {
        <ion-card class="ce-card ce-skeleton" role="status" aria-label="Cargando avance"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
      } @else if (consultaAvance.estado === 'error') {
        <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
          <p role="alert">{{ consultaAvance.mensaje }}</p>
          <ion-button fill="outline" (click)="cargarAvance()">Reintentar avance</ion-button>
        </div>
      } @else {
        <div class="ce-card-stack">
          @for (recinto of consultaAvance.filas; track recinto.id) {
            <ion-card class="ce-card">
              <div class="ce-card-top"><h3>{{ recinto.nombre }}</h3><span class="ce-metric">{{ recinto.porcentaje }} %</span></div>
              <p>{{ recinto.parroquia }} · {{ recinto.actas_registradas }} de {{ recinto.actas_esperadas }} actas</p>
              <ion-progress-bar class="ce-progress" [value]="recinto.porcentaje / 100" [attr.aria-label]="'Avance de ' + recinto.nombre" />
            </ion-card>
          } @empty {
            <div class="ce-state"><ion-icon name="business-outline" aria-hidden="true" /><p>No hay recintos registrados.</p></div>
          }
        </div>
      }
    </section>

    <section>
      <div class="ce-section-heading"><ion-icon name="bar-chart-outline" aria-hidden="true" /><h2>Resultados por candidato</h2></div>
      @let consultaResultados = resultados();
      <div class="ce-filters">
      <label>
        Cargo
        <select class="ce-native-select" #cargo [value]="cargoSeleccionado()" [disabled]="consultaResultados.estado === 'carga'"
          (change)="cambiarCargo(cargo.value)">
          <option value="alcalde">Alcalde</option>
          <option value="prefecto">Prefecto</option>
        </select>
      </label>
      <label>
        Recinto
        <select class="ce-native-select" #recinto [value]="recintoSeleccionado() ?? ''" [disabled]="consultaResultados.estado === 'carga'"
          (change)="cambiarRecinto(recinto.value)">
          <option value="">Consolidado</option>
          @if (consultaAvance.estado === 'exito') {
            @for (opcion of consultaAvance.filas; track opcion.id) {
              <option [value]="opcion.id">{{ opcion.nombre }} · {{ opcion.parroquia }}</option>
            }
          }
        </select>
      </label>
      </div>
      @if (consultaResultados.estado === 'carga') {
        <ion-card class="ce-card ce-skeleton" role="status" aria-label="Cargando resultados"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
      } @else if (consultaResultados.estado === 'error') {
        <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
          <p role="alert">{{ consultaResultados.mensaje }}</p>
          <ion-button fill="outline" (click)="cargarResultados()">Reintentar resultados</ion-button>
        </div>
      } @else {
        @let maximo = consultaResultados.filas[0]?.votos || 1;
        <div class="ce-card-stack">
          @for (resultado of consultaResultados.filas; track resultado.candidatura_id) {
            <ion-card class="ce-card">
              <div class="ce-card-top"><h3>{{ resultado.candidato }}</h3><span class="ce-metric">{{ resultado.votos }} votos</span></div>
              <p>{{ resultado.organizacion }}</p>
              <ion-progress-bar class="ce-progress ce-progress--votes" [value]="resultado.votos / maximo" aria-hidden="true" />
            </ion-card>
          } @empty {
            <div class="ce-state"><ion-icon name="person-outline" aria-hidden="true" /><p>No hay candidaturas para este cargo.</p></div>
          }
        </div>
      }
    </section>

    <section>
      <div class="ce-section-heading"><ion-icon name="location-outline" aria-hidden="true" /><h2>Ubicaciones de actas</h2></div>
      @let consultaGps = actasGps();
      @if (consultaGps.estado === 'carga') {
        <ion-card class="ce-card ce-skeleton" role="status" aria-label="Cargando ubicaciones"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
      } @else if (consultaGps.estado === 'error') {
        <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
          <p role="alert">{{ consultaGps.mensaje }}</p>
          <ion-button fill="outline" (click)="cargarGps()">Reintentar ubicaciones</ion-button>
        </div>
      } @else {
        <div class="ce-cards">
          @for (acta of consultaGps.filas; track acta.acta_id) {
            <ion-card class="ce-card">
              <h3>{{ acta.recinto }}</h3>
              <p>Mesa {{ acta.mesa }} · {{ acta.cargo }}</p>
              <p>{{ acta.veedor }} · {{ acta.creada_en | date: 'dd/MM/yyyy HH:mm' }}</p>
              @if (acta.enlaceMapa; as enlace) {
                <p>{{ acta.gps_lat }}, {{ acta.gps_lng }}</p>
                <div class="ce-actions"><ion-button fill="outline" [href]="enlace" target="_blank" rel="noopener noreferrer"><ion-icon slot="start" name="location-outline" aria-hidden="true" />Abrir en Google Maps</ion-button></div>
              } @else {
                <p>Acta sin coordenadas.</p>
              }
            </ion-card>
          } @empty {
            <div class="ce-state"><ion-icon name="archive-outline" aria-hidden="true" /><p>No hay actas registradas.</p></div>
          }
        </div>
      }
    </section>
    </div>
  `,
})
export class DashboardProvincialComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  readonly avance = signal<Consulta<AvanceRecinto>>({ estado: 'carga' });
  readonly resultados = signal<Consulta<ResultadoVotos>>({ estado: 'carga' });
  readonly actasGps = signal<Consulta<ActaGps & { enlaceMapa: string | null }>>({ estado: 'carga' });
  readonly cargoSeleccionado = signal<Cargo>('alcalde');
  readonly recintoSeleccionado = signal<number | null>(null);

  ngOnInit(): void {
    void this.cargarAvance();
    void this.cargarResultados();
    void this.cargarGps();
  }

  cargarAvance(): Promise<void> {
    return this.cargar(this.avance, () => this.dashboard.avance());
  }

  cargarResultados(): Promise<void> {
    return this.cargar(this.resultados, () => this.dashboard.resultados(this.cargoSeleccionado(), this.recintoSeleccionado()));
  }

  cargarGps(): Promise<void> {
    return this.cargar(this.actasGps, () => this.dashboard.actasGps());
  }

  cambiarCargo(cargo: string): void {
    if (cargo !== 'alcalde' && cargo !== 'prefecto') return;
    this.cargoSeleccionado.set(cargo);
    void this.cargarResultados();
  }

  cambiarRecinto(recinto: string): void {
    this.recintoSeleccionado.set(recinto ? Number(recinto) : null);
    void this.cargarResultados();
  }

  private async cargar<T>(consulta: WritableSignal<Consulta<T>>, consultar: () => Promise<T[]>): Promise<void> {
    consulta.set({ estado: 'carga' });
    try {
      consulta.set({ estado: 'exito', filas: await consultar() });
    } catch (error) {
      consulta.set({ estado: 'error', mensaje: mensajeError(error) });
    }
  }
}
