import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import type { Perfil } from '../models/perfil.model';
import { AuthService } from '../services/auth.service';
import { mensajeError } from '../services/errores';

@Component({
  selector: 'app-bienvenida',
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Control electoral</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (perfil; as usuario) {
        <h1>Hola, {{ usuario.nombres }}</h1>
        <p>Rol: {{ usuario.rol }}</p>
      }
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
      <ion-button fill="clear" [disabled]="saliendo()" (click)="salir()">Salir</ion-button>
    </ion-content>
  `,
})
export class BienvenidaPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly perfil = inject(ActivatedRoute).snapshot.data['perfil'] as Perfil | undefined;
  readonly error = signal('');
  readonly saliendo = signal(false);

  async salir(): Promise<void> {
    this.saliendo.set(true);
    try {
      await this.auth.cerrarSesion();
      await this.router.navigateByUrl('/acceso', { replaceUrl: true });
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.saliendo.set(false);
    }
  }
}
