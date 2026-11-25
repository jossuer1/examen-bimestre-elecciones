import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonBadge,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { mensajeError } from '../../core/errors/errores';
import { AuthService } from '../../core/services/auth.service';
import type { Cargo } from '../../shared/models/electoral.model';
import type { Perfil } from '../../shared/models/perfil.model';
import type { MesaVeedor } from '../../shared/models/vistas.model';
import { BottomNavigationComponent, type BottomNavigationItem } from '../../shared/components/bottom-navigation.component';
import { MesasService } from '../mesas/services/mesas.service';

import { FormularioActaComponent } from './components/formulario-acta.component';

@Component({
  selector: 'app-veedor',
  imports: [
    IonButton,
    IonButtons,
    IonBadge,
    IonCard,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonSkeletonText,
    IonTitle,
    IonToolbar,
    FormularioActaComponent,
    BottomNavigationComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis mesas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="ce-page">
      <div class="ce-intro">
        <ion-icon name="clipboard-outline" aria-hidden="true" />
        <h1>Hola, {{ perfil.nombres }}</h1>
      </div>
      @if (aviso()) {
        <p class="ce-alert ce-alert--success" role="status">{{ aviso() }}</p>
      }
      @if (errorSalida()) {
        <p class="ce-alert" role="alert">{{ errorSalida() }}</p>
      }
      @if (cargando()) {
        <div class="ce-cards" role="status" aria-label="Cargando mesas">
          @for (fila of [1, 2]; track fila) {
            <ion-card class="ce-card ce-skeleton" aria-hidden="true"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
          }
        </div>
      } @else if (errorMesas()) {
        <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
          <p role="alert">No se pudieron cargar tus mesas.</p>
          <ion-button fill="outline" (click)="cargar()">Reintentar</ion-button>
        </div>
      } @else if (mesas().length === 0) {
        <div class="ce-state"><ion-icon name="layers-outline" aria-hidden="true" />
          <h2>Aún no tienes mesas asignadas.</h2>
        </div>
      } @else {
        <section class="ce-cards" aria-label="Mesas asignadas">
          @for (mesa of mesas(); track mesa.id) {
            <ion-card class="ce-card">
              <div class="ce-card-top">
                <h2>Mesa {{ mesa.numero }}</h2>
                <ion-icon name="layers-outline" aria-hidden="true" />
              </div>
              <div class="ce-actions">
                <ion-badge class="ce-badge" [color]="estadoActa(mesa, 'alcalde') === 'Registrada' ? 'success' : 'warning'">Alcalde: {{ estadoActa(mesa, 'alcalde') }}</ion-badge>
                <ion-badge class="ce-badge" [color]="estadoActa(mesa, 'prefecto') === 'Registrada' ? 'success' : 'warning'">Prefecto: {{ estadoActa(mesa, 'prefecto') }}</ion-badge>
              </div>
              <div class="ce-actions">
                @if (estadoActa(mesa, 'alcalde') === 'Pendiente') {
                  <ion-button size="small" (click)="abrirActa(mesa, 'alcalde')">Registrar acta de alcalde</ion-button>
                }
                @if (estadoActa(mesa, 'prefecto') === 'Pendiente') {
                  <ion-button size="small" (click)="abrirActa(mesa, 'prefecto')">Registrar acta de prefecto</ion-button>
                }
              </div>
            </ion-card>
          }
        </section>
      }
      </main>
    </ion-content>
    <app-bottom-navigation [items]="navegacion()" (seleccion)="navegar($event)" />
    <ion-modal [breakpoints]="[0, 0.8, 1]" [initialBreakpoint]="1" [isOpen]="acta() !== null" [canDismiss]="puedeCerrarActa" (didDismiss)="acta.set(null)">
      <ng-template>
        @if (acta(); as registro) {
          <ion-header>
            <ion-toolbar>
              <ion-title>Mesa {{ registro.mesa.numero }} · {{ registro.cargo }}</ion-title>
              <ion-buttons slot="end">
                <ion-button [disabled]="actaOcupada()" (click)="acta.set(null)">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <div class="ce-sheet-body">
            <app-formulario-acta
              [mesaId]="registro.mesa.id"
              [cargo]="registro.cargo"
              (ocupacion)="actaOcupada.set($event)"
              (guardada)="alGuardarActa()"
            />
            </div>
          </ion-content>
        }
      </ng-template>
    </ion-modal>
  `,
})
export class VeedorPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly mesasService = inject(MesasService);

  readonly perfil = inject(ActivatedRoute).snapshot.data['perfil'] as Perfil;
  readonly navegacion = computed<BottomNavigationItem[]>(() => [
    { id: 'mesas', label: 'Mis mesas', icon: 'layers-outline', active: true },
    { id: 'actualizar', label: 'Actualizar', icon: 'refresh-outline', disabled: this.cargando() },
    { id: 'salir', label: 'Salir', icon: 'log-out-outline', color: 'medium', disabled: this.saliendo() },
  ]);
  readonly mesas = signal<MesaVeedor[]>([]);
  readonly cargando = signal(false);
  readonly errorMesas = signal(false);
  readonly errorSalida = signal('');
  readonly saliendo = signal(false);
  readonly acta = signal<{ mesa: MesaVeedor; cargo: Cargo } | null>(null);
  readonly actaOcupada = signal(false);
  readonly aviso = signal('');
  readonly puedeCerrarActa = async (): Promise<boolean> => !this.actaOcupada();

  ngOnInit(): void {
    void this.cargar();
  }

  navegar(accion: string): void {
    if (accion === 'actualizar') void this.cargar();
    if (accion === 'salir') void this.salir();
  }

  async cargar(): Promise<void> {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.errorMesas.set(false);
    try {
      this.mesas.set(await this.mesasService.listarAsignadas(this.perfil.id));
    } catch {
      this.errorMesas.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  estadoActa(mesa: MesaVeedor, cargo: Cargo): string {
    return mesa.actas.some((acta) => acta.cargo === cargo) ? 'Registrada' : 'Pendiente';
  }

  abrirActa(mesa: MesaVeedor, cargo: Cargo): void {
    this.aviso.set('');
    this.acta.set({ mesa, cargo });
  }

  async alGuardarActa(): Promise<void> {
    this.actaOcupada.set(false);
    this.acta.set(null);
    this.aviso.set('Acta y fotografía guardadas.');
    await this.cargar();
  }

  async salir(): Promise<void> {
    this.saliendo.set(true);
    this.errorSalida.set('');
    try {
      await this.auth.cerrarSesion();
      await this.router.navigateByUrl('/acceso', { replaceUrl: true });
    } catch (error) {
      this.errorSalida.set(mensajeError(error));
    } finally {
      this.saliendo.set(false);
    }
  }
}
