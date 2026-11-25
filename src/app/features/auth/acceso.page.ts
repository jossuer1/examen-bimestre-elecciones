import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonCard, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonNote } from '@ionic/angular';

import { mensajeError } from '../../core/errors/errores';
import {
  AuthService,
  esClaveRecuperacionValida,
  MENSAJE_CLAVE_RECUPERACION,
  rutaDePerfil,
} from '../../core/services/auth.service';
import { cedulaValidator } from '../../shared/validators/cedula.validator';

@Component({
  selector: 'app-acceso',
  imports: [ReactiveFormsModule, IonButton, IonCard, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonNote],
  template: `
    <ion-content class="ce-access-content">
      <main class="ce-access">
      <div class="ce-brand">
        <img src="assets/control-electoral-marca.svg" alt="Control Electoral" />
      </div>
      <ion-card class="ce-card ce-access-panel">
      <h1>{{ recuperacion() ? 'Recuperar contraseña' : cambio ? 'Cambia tu clave' : 'Iniciar sesión' }}</h1>
      @if (ocupado()) {
        <p role="status">Procesando…</p>
      }
      @if (errorPerfil()) {
        <p class="ce-alert" role="alert">No se pudo cargar tu perfil.</p>
        <ion-button type="button" fill="clear" [disabled]="ocupado()" (click)="reintentarPerfil()">
          Reintentar
        </ion-button>
      }
      @if (recuperacion(); as paso) {
        @if (error()) {
          <p class="ce-alert" role="alert">{{ error() }}</p>
        }
        @if (paso === 'completada') {
          <p class="ce-alert ce-alert--success" role="status">Tu contraseña se actualizó.</p>
          @if (!errorPerfil()) {
            <ion-button [disabled]="ocupado()" (click)="reintentarPerfil()">Continuar</ion-button>
          }
        } @else {
          <form [formGroup]="formRecuperacion" (ngSubmit)="continuarRecuperacion(paso)">
            @if (paso === 'cedula') {
              <ion-input label="Cédula" labelPlacement="floating" fill="outline" inputmode="numeric" maxlength="10" formControlName="cedula" />
              <ion-button type="submit" [disabled]="ocupado()">Solicitar código</ion-button>
            } @else {
              <p class="ce-alert ce-alert--success" role="status">Si la cédula está registrada, recibirás un código en el correo asociado.</p>
              <ion-input label="Código" labelPlacement="floating" fill="outline" inputmode="numeric" autocomplete="one-time-code" formControlName="codigo" />
              <ion-input
                label="Nueva contraseña"
                labelPlacement="floating"
                fill="outline"
                type="password"
                autocomplete="new-password"
                formControlName="clave"
              ><ion-input-password-toggle slot="end" /></ion-input>
              <p>{{ requisitosClave }}</p>
              <ion-button type="submit" [disabled]="ocupado()">Cambiar contraseña</ion-button>
              <ion-button type="button" fill="clear" [disabled]="ocupado()" (click)="volverDeRecuperacion('cedula')">
                Solicitar otro código
              </ion-button>
            }
          </form>
          <ion-button fill="clear" [disabled]="ocupado()" (click)="volverDeRecuperacion(null)">
            Volver al acceso
          </ion-button>
        }
      } @else {
        <form [formGroup]="form" (ngSubmit)="continuar()">
          @if (!cambio) {
            <ion-input
              label="Cédula"
              labelPlacement="floating"
              fill="outline"
              inputmode="numeric"
              autocomplete="username"
              maxlength="10"
              formControlName="cedula"
            />
            @if (form.controls.cedula.touched && form.controls.cedula.invalid) {
              <ion-note class="ce-field-error">Ingresa los 10 dígitos de tu cédula.</ion-note>
            }
          }
          <ion-input
            [label]="cambio ? 'Nueva clave' : 'Clave'"
            labelPlacement="floating"
            fill="outline"
            [autocomplete]="cambio ? 'new-password' : 'current-password'"
            type="password"
            formControlName="clave"
          ><ion-input-password-toggle slot="end" /></ion-input>
          @if (form.controls.clave.touched && form.controls.clave.invalid) {
            <ion-note class="ce-field-error">{{ cambio ? 'Ingresa al menos 8 caracteres.' : 'Ingresa tu clave.' }}</ion-note>
          }
          @if (error()) {
            <p class="ce-alert" role="alert">{{ error() }}</p>
          }
          <ion-button type="submit" [disabled]="ocupado() || errorPerfil() || form.invalid">
            {{ cambio ? 'Guardar clave' : 'Ingresar' }}
            <ion-icon slot="end" name="arrow-forward-outline" aria-hidden="true" />
          </ion-button>
          @if (cambio) {
            <ion-button type="button" fill="clear" [disabled]="ocupado()" (click)="salir()"> Salir </ion-button>
          } @else {
            <ion-button type="button" fill="clear" [disabled]="ocupado() || errorPerfil()" (click)="abrirRecuperacion()">
              Olvidé mi contraseña
            </ion-button>
          }
        </form>
      }
      </ion-card>
      </main>
    </ion-content>
  `,
})
export class AccesoPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly ruta = inject(ActivatedRoute);

  readonly cambio = this.ruta.snapshot.routeConfig?.path === 'cambiar-clave';
  readonly errorPerfil = signal(this.ruta.snapshot.data['perfil'] === 'error-perfil');
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly recuperacion = signal<'cedula' | 'codigo' | 'completada' | null>(null);
  readonly requisitosClave = MENSAJE_CLAVE_RECUPERACION;
  readonly formRecuperacion = this.fb.group({
    cedula: ['', cedulaValidator],
    codigo: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    clave: ['', (control: AbstractControl<string>) => esClaveRecuperacionValida(control.value) ? null : { clave: true }],
  });
  readonly form = this.fb.group({
    cedula: ['', this.cambio ? [] : [Validators.required, Validators.pattern(/^\d{10}$/)]],
    clave: ['', this.cambio ? [Validators.required, Validators.minLength(8)] : [Validators.required]],
  });

  abrirRecuperacion(): void {
    this.error.set('');
    this.formRecuperacion.reset({ cedula: this.form.controls.cedula.value });
    this.recuperacion.set('cedula');
  }

  async continuarRecuperacion(paso: 'cedula' | 'codigo'): Promise<void> {
    if (this.ocupado() || this.recuperacion() !== paso) return;
    const { cedula, codigo, clave } = this.formRecuperacion.controls;
    this.error.set('');
    this.ocupado.set(true);
    try {
      if (paso === 'cedula') {
        if (cedula.invalid) throw new Error('Ingresa una cédula válida.');
        await this.auth.solicitarRecuperacion(cedula.value);
        this.recuperacion.set('codigo');
      } else {
        if (codigo.invalid) throw new Error('Ingresa el código numérico de tu correo.');
        if (clave.invalid) throw new Error(this.requisitosClave);
        await this.auth.recuperarClave(codigo.value, clave.value);
        this.formRecuperacion.reset();
        this.recuperacion.set('completada');
      }
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.ocupado.set(false);
    }
  }

  async volverDeRecuperacion(paso: 'cedula' | null): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await this.auth.cancelarRecuperacion();
      this.formRecuperacion.reset({ cedula: paso ? this.formRecuperacion.controls.cedula.value : '' });
      this.recuperacion.set(paso);
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.ocupado.set(false);
    }
  }

  async continuar(): Promise<void> {
    if (this.form.invalid || this.ocupado() || this.errorPerfil()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      const { cedula, clave } = this.form.getRawValue();
      if (this.cambio) {
        await this.auth.cambiarClave(clave);
        this.form.controls.clave.reset();
        await this.reintentarPerfil();
        return;
      }
      const perfil = await this.auth.iniciarSesion(cedula, clave);
      await this.router.navigateByUrl(rutaDePerfil(perfil), { replaceUrl: true });
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.ocupado.set(false);
    }
  }

  async reintentarPerfil(): Promise<void> {
    this.ocupado.set(true);
    this.error.set('');
    try {
      const perfil = await this.auth.perfilActual();
      this.errorPerfil.set(false);
      if (this.cambio && perfil?.debe_cambiar_clave) {
        this.error.set('Tu clave cambió, pero el sistema aún no pudo confirmarlo. Contacta a tu coordinador.');
        return;
      }
      await this.router.navigateByUrl(perfil ? rutaDePerfil(perfil) : '/acceso', { replaceUrl: true });
    } catch {
      this.errorPerfil.set(true);
    } finally {
      this.ocupado.set(false);
    }
  }

  async salir(): Promise<void> {
    this.ocupado.set(true);
    try {
      await this.auth.cerrarSesion();
      await this.router.navigateByUrl('/acceso', { replaceUrl: true });
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.ocupado.set(false);
    }
  }
}
