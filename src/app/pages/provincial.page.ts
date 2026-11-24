import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { FormularioUsuarioComponent } from '../components/formulario-usuario.component';
import type { RecintoResumen } from '../models/vistas.model';
import { AuthService } from '../services/auth.service';
import { mensajeError } from '../services/errores';
import { RecintosService } from '../services/recintos.service';

@Component({
  selector: 'app-provincial',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonModal,
    FormularioUsuarioComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Recintos</ion-title>
        <ion-buttons slot="end">
          <ion-button [disabled]="saliendo()" (click)="salir()">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (errorSalida()) {
        <p class="ion-padding" role="alert">{{ errorSalida() }}</p>
      }
      @if (cargando()) {
        <div class="ion-padding ion-text-center"><ion-spinner></ion-spinner></div>
      } @else if (error()) {
        <div class="ion-padding">
          <ion-text color="danger"
            ><p>{{ error() }}</p></ion-text
          >
          <ion-button (click)="cargar()">Reintentar</ion-button>
        </div>
      } @else if (recintos().length === 0) {
        <p class="ion-padding">No hay recintos registrados.</p>
      } @else {
        <ion-list>
          @for (r of recintos(); track r.id) {
            <ion-item>
              <ion-label>
                <h2>{{ r.nombre }}</h2>
                <p>{{ r.parroquia }} · {{ r.cantidad_jrv }} JRV</p>
                <p>Coordinador: {{ r.coordinador ?? 'Sin asignar' }}</p>
              </ion-label>
              @if (!r.coordinador) {
                <ion-button slot="end" size="small" (click)="abrir(r)">Crear coordinador</ion-button>
              }
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>

    <ion-modal [isOpen]="modalAbierto()" (didDismiss)="cerrar()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Nuevo coordinador</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <p>
            Recinto: <strong>{{ seleccionado()?.nombre }}</strong>
          </p>
          <app-formulario-usuario
            [recintoId]="seleccionado()?.id ?? null"
            (guardado)="alGuardar($event)"
            (cancelado)="cerrar()"
          />
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
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorSalida = signal('');
  readonly saliendo = signal(false);
  readonly modalAbierto = signal(false);
  readonly seleccionado = signal<RecintoResumen | null>(null);

  ngOnInit(): void {
    this.cargar();
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
}
