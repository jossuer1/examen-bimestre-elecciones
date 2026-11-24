import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonInput, IonTitle, IonToolbar } from '@ionic/angular';

import { AuthService, rutaDePerfil } from '../services/auth.service';
import { mensajeError } from '../services/errores';

@Component({
  selector: 'app-acceso',
  imports: [ReactiveFormsModule, IonButton, IonContent, IonHeader, IonInput, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Control electoral</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>{{ cambio ? 'Cambia tu clave' : 'Iniciar sesión' }}</h1>
      @if (errorPerfil()) {
        <p role="alert">No se pudo cargar tu perfil.</p>
        <ion-button type="button" fill="clear" [disabled]="ocupado()" (click)="reintentarPerfil()">
          Reintentar
        </ion-button>
      }
      <form [formGroup]="form" (ngSubmit)="continuar()">
        @if (!cambio) {
          <ion-input
            label="Cédula"
            labelPlacement="stacked"
            inputmode="numeric"
            autocomplete="username"
            maxlength="10"
            formControlName="cedula"
          />
        }
        <ion-input
          [label]="cambio ? 'Nueva clave' : 'Clave'"
          labelPlacement="stacked"
          [autocomplete]="cambio ? 'new-password' : 'current-password'"
          type="password"
          formControlName="clave"
        />
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
        <ion-button type="submit" [disabled]="ocupado() || form.invalid">
          {{ cambio ? 'Guardar clave' : 'Ingresar' }}
        </ion-button>
        @if (cambio) {
          <ion-button type="button" fill="clear" [disabled]="ocupado()" (click)="salir()"> Salir </ion-button>
        }
      </form>
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
  readonly form = this.fb.group({
    cedula: ['', this.cambio ? [] : [Validators.required, Validators.pattern(/^\d{10}$/)]],
    clave: ['', this.cambio ? [Validators.required, Validators.minLength(8)] : [Validators.required]],
  });

  async continuar(): Promise<void> {
    if (this.form.invalid || this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      const { cedula, clave } = this.form.getRawValue();
      if (this.cambio) await this.auth.cambiarClave(clave);
      const perfil = this.cambio ? await this.auth.perfilActual() : await this.auth.iniciarSesion(cedula, clave);
      await this.router.navigateByUrl(perfil ? rutaDePerfil(perfil) : '/acceso', { replaceUrl: true });
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
      if (perfil) await this.router.navigateByUrl(rutaDePerfil(perfil), { replaceUrl: true });
      this.errorPerfil.set(false);
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
