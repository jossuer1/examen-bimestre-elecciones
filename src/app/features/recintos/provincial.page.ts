import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/errors/errores';
import { AuthService } from '../../core/services/auth.service';
import type { RecintoResumen } from '../../shared/models/vistas.model';
import { BottomNavigationComponent, type BottomNavigationItem } from '../../shared/components/bottom-navigation.component';
import { FormularioUsuarioComponent } from '../usuarios/components/formulario-usuario.component';

import { DashboardProvincialComponent } from './components/dashboard-provincial.component';
import { FormularioRecintoComponent } from './components/formulario-recinto.component';
import { RecintosService } from './services/recintos.service';

@Component({
  selector: 'app-provincial',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonContent,
    IonCard,
    IonIcon,
    IonSkeletonText,
    IonModal,
    DashboardProvincialComponent,
    FormularioRecintoComponent,
    FormularioUsuarioComponent,
    BottomNavigationComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ verDashboard() ? 'Dashboard provincial' : 'Recintos' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="ce-page">
      @if (!verDashboard()) {
        <div class="ce-intro"><ion-icon name="business-outline" aria-hidden="true" /><div><h1>Recintos electorales</h1><p>Administración provincial</p></div></div>
      }
      @if (errorSalida()) {
        <p class="ce-alert" role="alert">{{ errorSalida() }}</p>
      }
      @if (verDashboard()) {
        <app-dashboard-provincial />
      } @else if (cargando()) {
        <div class="ce-cards" role="status" aria-label="Cargando recintos">
          @for (fila of [1, 2]; track fila) {
            <ion-card class="ce-card ce-skeleton" aria-hidden="true"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
          }
        </div>
      } @else if (error()) {
        <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
          <p role="alert">{{ error() }}</p>
          <ion-button fill="outline" (click)="cargar()">Reintentar</ion-button>
        </div>
      } @else if (recintos().length === 0) {
        <div class="ce-state"><ion-icon name="business-outline" aria-hidden="true" /><h2>No hay recintos registrados.</h2>
          <ion-button (click)="modalRecintoAbierto.set(true)">Nuevo recinto</ion-button>
        </div>
      } @else {
        <section class="ce-cards" aria-label="Recintos">
          @for (r of recintos(); track r.id) {
            <ion-card class="ce-card">
              <div class="ce-card-top"><h2>{{ r.nombre }}</h2><ion-icon name="business-outline" aria-hidden="true" /></div>
                <p>{{ r.parroquia }} · {{ r.cantidad_jrv }} JRV</p>
                <p>Coordinador: {{ r.coordinador ?? 'Sin asignar' }}</p>
              @if (!r.coordinador) {
                <div class="ce-actions"><ion-button size="small" fill="outline" (click)="abrir(r)"><ion-icon slot="start" name="person-add-outline" aria-hidden="true" />Crear coordinador</ion-button></div>
              }
            </ion-card>
          }
        </section>
      }
      </main>
    </ion-content>

    <app-bottom-navigation [items]="navegacion()" (seleccion)="navegar($event)" />

    <ion-modal [breakpoints]="[0, 0.8, 1]" [initialBreakpoint]="0.8" [isOpen]="modalRecintoAbierto()" (didDismiss)="modalRecintoAbierto.set(false)">
      <ng-template>
        <ion-header>
          <ion-toolbar><ion-title>Nuevo recinto</ion-title></ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="ce-sheet-body"><app-formulario-recinto (guardado)="alGuardarRecinto($event)" (cancelado)="modalRecintoAbierto.set(false)" /></div>
        </ion-content>
      </ng-template>
    </ion-modal>

    <ion-modal [breakpoints]="[0, 0.8, 1]" [initialBreakpoint]="1" [isOpen]="modalAbierto()" (didDismiss)="cerrar()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Nuevo coordinador</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="ce-sheet-body">
          <p>
            Recinto: <strong>{{ seleccionado()?.nombre }}</strong>
          </p>
          <app-formulario-usuario
            [recintoId]="seleccionado()?.id ?? null"
            (guardado)="alGuardar($event)"
            (cancelado)="cerrar()"
          />
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
})
export class ProvincialPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly recintosService = inject(RecintosService);
  private readonly toast = inject(ToastController);

  readonly recintos = signal<RecintoResumen[]>([]);
  readonly verDashboard = signal(false);
  readonly navegacion = computed<BottomNavigationItem[]>(() => [
    { id: 'recintos', label: 'Recintos', icon: 'business-outline', active: !this.verDashboard() },
    { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-outline', active: this.verDashboard() },
    { id: 'nuevo-recinto', label: 'Nuevo recinto', icon: 'add-circle-outline' },
    { id: 'salir', label: 'Salir', icon: 'log-out-outline', color: 'medium', disabled: this.saliendo() },
  ]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorSalida = signal('');
  readonly saliendo = signal(false);
  readonly modalAbierto = signal(false);
  readonly modalRecintoAbierto = signal(false);
  readonly seleccionado = signal<RecintoResumen | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  navegar(accion: string): void {
    if (accion === 'recintos') this.verDashboard.set(false);
    if (accion === 'dashboard') this.verDashboard.set(true);
    if (accion === 'nuevo-recinto') this.modalRecintoAbierto.set(true);
    if (accion === 'salir') void this.salir();
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

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.recintos.set(await this.recintosService.listar());
    } catch {
      this.error.set('No se pudieron cargar los recintos.');
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(r: RecintoResumen): void {
    this.seleccionado.set(r);
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
  }

  async alGuardar(correoEnviado: boolean): Promise<void> {
    this.cerrar();
    const t = await this.toast.create({
      message: correoEnviado
        ? 'Coordinador creado. Se envió el correo de confirmación.'
        : 'Coordinador creado, pero no se pudo enviar el correo de confirmación.',
      duration: 3500,
      color: correoEnviado ? 'success' : 'warning',
    });
    await t.present();
    await this.cargar();
  }

  async alGuardarRecinto(cantidad: number): Promise<void> {
    this.modalRecintoAbierto.set(false);
    await this.cargar();
    const aviso = await this.toast.create({
      message: `Recinto creado con ${cantidad} ${cantidad === 1 ? 'mesa' : 'mesas'}.`,
      duration: 3500,
      color: 'success',
    });
    await aviso.present();
  }
}
