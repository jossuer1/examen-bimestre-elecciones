import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, IonNote, IonSpinner } from '@ionic/angular';

import { mensajeError } from '../../../core/errors/errores';
import { cedulaValidator } from '../../../shared/validators/cedula.validator';
import { UsuariosService } from '../services/usuarios.service';

type Campo = 'cedula' | 'nombres' | 'apellidos' | 'telefono' | 'correo';

@Component({
  selector: 'app-formulario-usuario',
  standalone: true,
  imports: [ReactiveFormsModule, IonInput, IonButton, IonNote, IonSpinner],
  template: `
    <form class="ce-form" [formGroup]="form" (ngSubmit)="guardar()">
      @if (error()) {
        <p class="ce-alert" role="alert">{{ error() }}</p>
      }

      <ion-input
        label="Cédula"
        labelPlacement="floating"
        fill="outline"
        formControlName="cedula"
        inputmode="numeric"
        maxlength="10"
      ></ion-input>
      @if (mensaje('cedula')) {
        <ion-note color="danger">{{ mensaje('cedula') }}</ion-note>
      }

      <ion-input
        label="Nombres"
        labelPlacement="floating"
        fill="outline"
        formControlName="nombres"
        class="ion-margin-top"
      ></ion-input>
      @if (mensaje('nombres')) {
        <ion-note color="danger">{{ mensaje('nombres') }}</ion-note>
      }

      <ion-input
        label="Apellidos"
        labelPlacement="floating"
        fill="outline"
        formControlName="apellidos"
        class="ion-margin-top"
      ></ion-input>
      @if (mensaje('apellidos')) {
        <ion-note color="danger">{{ mensaje('apellidos') }}</ion-note>
      }

      <ion-input
        label="Teléfono"
        labelPlacement="floating"
        fill="outline"
        formControlName="telefono"
        inputmode="tel"
        maxlength="10"
        class="ion-margin-top"
      ></ion-input>
      @if (mensaje('telefono')) {
        <ion-note color="danger">{{ mensaje('telefono') }}</ion-note>
      }

      <ion-input
        label="Correo"
        labelPlacement="floating"
        fill="outline"
        formControlName="correo"
        type="email"
        class="ion-margin-top"
      ></ion-input>
      @if (mensaje('correo')) {
        <ion-note color="danger">{{ mensaje('correo') }}</ion-note>
      }

      <ion-button expand="block" type="submit" class="ion-margin-top" [disabled]="cargando()">
        @if (cargando()) {
          <ion-spinner name="dots"></ion-spinner>
        } @else {
          Crear usuario
        }
      </ion-button>
      <ion-button expand="block" fill="clear" type="button" (click)="cancelado.emit()"> Cancelar </ion-button>
    </form>
  `,
})
export class FormularioUsuarioComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarios = inject(UsuariosService);

  /** Con recintoId se crea un coordinador; sin él, un veedor. */
  readonly recintoId = input<number | null>(null);
  readonly guardado = output<boolean>(); // true si se envió el correo de confirmación
  readonly cancelado = output<void>();

  readonly cargando = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    cedula: ['', [Validators.required, cedulaValidator]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
    correo: ['', [Validators.required, Validators.email]],
  });

  mensaje(campo: Campo): string {
    const c = this.form.controls[campo];
    if (!c.touched || !c.invalid) return '';
    if (c.hasError('required')) return 'Este campo es obligatorio.';
    if (campo === 'cedula') return 'La cédula no es válida.';
    if (campo === 'telefono') return 'Ingresa 9 o 10 dígitos.';
    if (campo === 'correo') return 'Ingresa un correo válido.';
    return 'Revisa este campo.';
  }

  async guardar(): Promise<void> {
    if (this.cargando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    try {
      const datos = this.form.getRawValue();
      const id = this.recintoId();
      const enviado =
        id !== null ? await this.usuarios.crearCoordinador(id, datos) : await this.usuarios.crearVeedor(datos);
      this.guardado.emit(enviado);
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
