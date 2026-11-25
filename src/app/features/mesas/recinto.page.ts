import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/errors/errores';
import { AuthService } from '../../core/services/auth.service';
import type { EstadoMesa } from '../../shared/models/electoral.model';
import type { Perfil } from '../../shared/models/perfil.model';
import type { MesaResumen, VeedorOpcion } from '../../shared/models/vistas.model';
import { BottomNavigationComponent, type BottomNavigationItem } from '../../shared/components/bottom-navigation.component';
import { ActasMesaComponent } from '../actas/components/actas-mesa.component';
import { RecintosService } from '../recintos/services/recintos.service';
import { FormularioUsuarioComponent } from '../usuarios/components/formulario-usuario.component';

import { MesasService } from './services/mesas.service';

const ETIQUETA_ESTADO: Record<EstadoMesa, { texto: string; color: string; icono: string }> = {
  sin_asignar: { texto: 'Sin asignar', color: 'medium', icono: 'layers-outline' },
  asignada: { texto: 'Asignada', color: 'primary', icono: 'person-outline' },
  acta_parcial: { texto: 'Acta parcial', color: 'warning', icono: 'time-outline' },
  completa: { texto: 'Completa', color: 'success', icono: 'checkmark-circle-outline' },
};

@Component({
  selector: 'app-recinto',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSkeletonText,
    IonModal,
    ActasMesaComponent,
    FormularioUsuarioComponent,
    BottomNavigationComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ nombreRecinto() }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="ce-page">
      <div class="ce-intro"><ion-icon name="layers-outline" aria-hidden="true" /><h1>Mesas del recinto</h1></div>
      @if (errorSalida()) {
        <p class="ce-alert" role="alert">{{ errorSalida() }}</p>
      }
      @if (cargando()) {
        <div class="ce-cards" role="status" aria-label="Cargando mesas">
          @for (fila of [1, 2]; track fila) {
            <ion-card class="ce-card ce-skeleton" aria-hidden="true"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
          }
        </div>
      } @else if (error()) {
        <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
          <p role="alert">{{ error() }}</p>
          <ion-button fill="outline" (click)="cargar()">Reintentar</ion-button>
        </div>
      } @else if (mesas().length === 0) {
        <div class="ce-state"><ion-icon name="layers-outline" aria-hidden="true" /><h2>Este recinto no tiene mesas.</h2></div>
      } @else {
        <section class="ce-cards" aria-label="Mesas del recinto">
          @for (m of mesas(); track m.id) {
            <ion-card class="ce-card">
              <div class="ce-card-top">
              <h2><button class="ce-text-button" type="button" (click)="mesaActas.set(m)">Mesa {{ m.numero }}</button></h2>
              <ion-badge class="ce-badge" [color]="etiqueta[m.estado].color">
                <ion-icon [name]="etiqueta[m.estado].icono" aria-hidden="true" />
                {{ etiqueta[m.estado].texto }}
              </ion-badge>
              </div>
              <p>Veedor: {{ m.veedor ?? 'Sin asignar' }}</p>
              <div class="ce-actions">
              <ion-button size="small" fill="outline" (click)="abrirAsignar(m)">
                {{ m.veedor_id ? 'Reasignar' : 'Asignar' }}
              </ion-button>
              </div>
            </ion-card>
          }
        </section>
      }
      </main>
    </ion-content>

    <app-bottom-navigation [items]="navegacion()" (seleccion)="navegar($event)" />

    <ion-modal [breakpoints]="[0, 0.8, 1]" [initialBreakpoint]="1" [isOpen]="mesaActas() !== null" [canDismiss]="puedeCerrarActas" (didDismiss)="mesaActas.set(null)">
      <ng-template>
        @if (mesaActas(); as mesa) {
          <ion-header>
            <ion-toolbar>
              <ion-title>Actas de la mesa {{ mesa.numero }}</ion-title>
              <ion-buttons slot="end">
                <ion-button [disabled]="actaOcupada()" (click)="mesaActas.set(null)">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <div class="ce-sheet-body"><app-actas-mesa [mesaId]="mesa.id" (ocupacion)="actaOcupada.set($event)" /></div>
          </ion-content>
        }
      </ng-template>
    </ion-modal>

    <!-- Modal: nuevo veedor (el recinto lo decide el servidor) -->
    <ion-modal [breakpoints]="[0, 0.8, 1]" [initialBreakpoint]="1" [isOpen]="modalVeedor()" (didDismiss)="modalVeedor.set(false)">
      <ng-template>
        <ion-header>
          <ion-toolbar><ion-title>Nuevo veedor</ion-title></ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="ce-sheet-body"><app-formulario-usuario (guardado)="alCrearVeedor($event)" (cancelado)="modalVeedor.set(false)" /></div>
        </ion-content>
      </ng-template>
    </ion-modal>

    <!-- Modal: asignar o reasignar veedor a una mesa -->
    <ion-modal [breakpoints]="[0, 0.8, 1]" [initialBreakpoint]="0.8" [isOpen]="modalAsignar()" (didDismiss)="modalAsignar.set(false)">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Mesa {{ mesaSeleccionada()?.numero }}</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="modalAsignar.set(false)">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          @if (cargandoVeedores()) {
            <ion-card class="ce-card ce-skeleton" role="status" aria-label="Cargando veedores"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
          } @else if (errorVeedores()) {
            <div class="ce-state ce-state--error"><ion-icon name="alert-circle-outline" aria-hidden="true" />
              <p role="alert">No se pudieron cargar los veedores.</p>
              <ion-button (click)="cargarVeedores()">Reintentar</ion-button>
            </div>
          } @else if (veedores().length === 0) {
            <div class="ce-state"><ion-icon name="person-outline" aria-hidden="true" /><p>Aún no hay veedores. Crea uno con el botón "Veedor".</p></div>
          } @else {
            <ion-list>
              @for (v of veedores(); track v.id) {
                <ion-item button [disabled]="asignando()" (click)="asignar(v.id)">
                  <ion-label>
                    {{ v.nombres }} {{ v.apellidos }}
                    <p>CI {{ v.cedula }}</p>
                  </ion-label>
                  @if (v.id === mesaSeleccionada()?.veedor_id) {
                    <ion-badge slot="end">Actual</ion-badge>
                  }
                </ion-item>
              }
            </ion-list>
          }
          @if (mesaSeleccionada()?.veedor_id) {
            <ion-button
              class="ion-margin"
              color="danger"
              fill="outline"
              [disabled]="asignando()"
              (click)="asignar(null)"
            >
              Quitar veedor
            </ion-button>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
})
export class RecintoPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly perfil = inject(ActivatedRoute).snapshot.data['perfil'] as Perfil;
  private readonly mesasService = inject(MesasService);
  private readonly recintosService = inject(RecintosService);
  private readonly toast = inject(ToastController);

  readonly etiqueta = ETIQUETA_ESTADO;
  readonly nombreRecinto = signal('Mi recinto');
  readonly navegacion = computed<BottomNavigationItem[]>(() => [
    { id: 'mesas', label: 'Mesas', icon: 'layers-outline', active: true },
    { id: 'veedor', label: 'Veedor', icon: 'person-add-outline' },
    { id: 'salir', label: 'Salir', icon: 'log-out-outline', color: 'medium', disabled: this.saliendo() },
  ]);
  readonly mesas = signal<MesaResumen[]>([]);
  readonly veedores = signal<VeedorOpcion[]>([]);
  readonly cargando = signal(true);
  readonly cargandoVeedores = signal(false);
  readonly errorVeedores = signal(false);
  readonly asignando = signal(false);
  readonly error = signal('');
  readonly errorSalida = signal('');
  readonly saliendo = signal(false);
  readonly modalVeedor = signal(false);
  readonly modalAsignar = signal(false);
  readonly mesaSeleccionada = signal<MesaResumen | null>(null);
  readonly mesaActas = signal<MesaResumen | null>(null);
  readonly actaOcupada = signal(false);
  readonly puedeCerrarActas = async (): Promise<boolean> => !this.actaOcupada();

  ngOnInit(): void {
    this.cargar();
  }

  navegar(accion: string): void {
    if (accion === 'veedor') this.modalVeedor.set(true);
    if (accion === 'salir') void this.salir();
  }

  async cargar(mostrarSpinner = true): Promise<void> {
    const recintoId = this.perfil.recinto_id;
    if (!recintoId) {
      this.error.set('Tu cuenta no tiene un recinto asignado.');
      this.cargando.set(false);
      return;
    }
    if (mostrarSpinner) this.cargando.set(true);
    this.error.set('');
    try {
      const [mesas, recintos] = await Promise.all([
        this.mesasService.listar(recintoId),
        this.recintosService.listar(), // RLS: solo devuelve SU recinto
      ]);
      this.mesas.set(mesas);
      const recinto = recintos.find((r) => r.id === recintoId);
      if (recinto) this.nombreRecinto.set(recinto.nombre);
    } catch {
      this.error.set('No se pudieron cargar las mesas.');
    } finally {
      this.cargando.set(false);
    }
  }

  abrirAsignar(mesa: MesaResumen): void {
    if (this.asignando()) return;
    this.veedores.set([]);
    this.mesaSeleccionada.set(mesa);
    this.modalAsignar.set(true);
    void this.cargarVeedores();
  }

  async cargarVeedores(): Promise<void> {
    if (this.cargandoVeedores()) return;
    this.cargandoVeedores.set(true);
    this.errorVeedores.set(false);
    try {
      this.veedores.set(await this.mesasService.listarVeedores());
    } catch {
      this.errorVeedores.set(true);
    } finally {
      this.cargandoVeedores.set(false);
    }
  }

  async asignar(veedorId: string | null): Promise<void> {
    const mesa = this.mesaSeleccionada();
    if (!mesa || this.asignando()) return;
    this.asignando.set(true);
    try {
      await this.mesasService.asignar(mesa.id, veedorId);
      this.modalAsignar.set(false);
      await this.avisar(veedorId ? 'Veedor asignado.' : 'Veedor retirado de la mesa.', 'success');
      await this.cargar(false);
    } catch (e) {
      await this.avisar(mensajeError(e), 'danger');
    } finally {
      this.asignando.set(false);
    }
  }

  async alCrearVeedor(correoEnviado: boolean): Promise<void> {
    this.modalVeedor.set(false);
    await this.avisar(
      correoEnviado
        ? 'Veedor creado. Se envió el correo de confirmación.'
        : 'Veedor creado, pero no se pudo enviar el correo de confirmación.',
      correoEnviado ? 'success' : 'warning',
    );
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

  private async avisar(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const t = await this.toast.create({ message, duration: 3500, color });
    await t.present();
  }
}
