import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular';

import { AuthService, rutaDePerfil } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  constructor() {
    const destroyRef = inject(DestroyRef);
    void App.addListener('appUrlOpen', ({ url }) => { void this.abrirEnlace(url); }).then((listener) => {
      destroyRef.onDestroy(() => { void listener.remove(); });
    });
    void App.getLaunchUrl().then((resultado) => {
      if (resultado?.url) void this.abrirEnlace(resultado.url);
    });
  }

  private async abrirEnlace(url: string): Promise<void> {
    if (!url.startsWith('controlelectoral://confirmar')) return;
    try {
      const perfil = await this.auth.completarConfirmacion(url);
      await this.router.navigateByUrl(rutaDePerfil(perfil), { replaceUrl: true });
      await this.mostrarAviso('Cuenta confirmada. Cambia tu clave inicial para continuar.', 'success');
    } catch {
      await this.router.navigateByUrl('/acceso', { replaceUrl: true });
      await this.mostrarAviso('El enlace de confirmación no es válido o ya caducó.', 'danger');
    }
  }

  private async mostrarAviso(message: string, color: 'success' | 'danger'): Promise<void> {
    const aviso = await this.toast.create({ message, color, duration: 4000 });
    await aviso.present();
  }
}
