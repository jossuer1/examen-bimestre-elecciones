import type { OnInit } from '@angular/core';
import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, IonNote, IonSelect, IonSelectOption, IonSkeletonText, IonSpinner } from '@ionic/angular';

import { mensajeError } from '../../../core/errors/errores';
import { MAX_JRV } from '../../../shared/models/constantes';
import type { Parroquia } from '../../../shared/models/geografia.model';
import { RecintosService } from '../services/recintos.service';

@Component({
  selector: 'app-formulario-recinto',
  standalone: true,
  imports: [ReactiveFormsModule, IonInput, IonSelect, IonSelectOption, IonButton, IonNote, IonSkeletonText, IonSpinner],
  template: `
    <form class="ce-form" [formGroup]="form" (ngSubmit)="guardar()">
      @if (error()) {
        <p class="ce-alert" role="alert">{{ error() }}</p>
      }

      @if (cargandoParroquias()) {
        <div class="ce-skeleton" role="status" aria-label="Cargando parroquias"><ion-skeleton-text animated /></div>
      }
      <ion-select
        label="Parroquia"
        labelPlacement="floating"
        fill="outline"
        interface="popover"
        formControlName="parroquia_id"
      >
        @for (p of parroquias(); track p.id) {
          <ion-select-option [value]="p.id">{{ p.nombre }}</ion-select-option>
        }
      </ion-select>
      @if (form.controls.parroquia_id.touched && form.controls.parroquia_id.invalid) {
        <ion-note class="ce-field-error">Selecciona una parroquia.</ion-note>
      }

      <ion-input
        label="Nombre del recinto"
        labelPlacement="floating"
        fill="outline"
        formControlName="nombre"
        class="ion-margin-top"
      ></ion-input>
      @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
        <ion-note class="ce-field-error">Ingresa un nombre de al menos 3 caracteres.</ion-note>
      }

      <ion-input
        label="Cantidad de JRV (mesas)"
        labelPlacement="floating"
        fill="outline"
        type="number"
        inputmode="numeric"
        formControlName="cantidad_jrv"
        class="ion-margin-top"
      ></ion-input>
      @if (form.controls.cantidad_jrv.touched && form.controls.cantidad_jrv.invalid) {
        <ion-note class="ce-field-error">Ingresa un número entero entre 1 y {{ max }}.</ion-note>
      }

      <ion-button expand="block" type="submit" class="ion-margin-top" [disabled]="cargando() || cargandoParroquias()">
        @if (cargando()) {
          <ion-spinner name="dots"></ion-spinner>
        } @else {
          Crear recinto
        }
      </ion-button>
      <ion-button expand="block" fill="clear" type="button" (click)="cancelado.emit()"> Cancelar </ion-button>
    </form>
  `,
})
export class FormularioRecintoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly recintos = inject(RecintosService);

  readonly guardado = output<number>(); // cantidad de mesas generadas
  readonly cancelado = output<void>();

  readonly max = MAX_JRV;
  readonly parroquias = signal<Parroquia[]>([]);
  readonly cargandoParroquias = signal(true);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    parroquia_id: this.fb.control<number | null>(null, Validators.required),
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    cantidad_jrv: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_JRV),
      Validators.pattern(/^\d+$/),
    ]),
  });

  async ngOnInit(): Promise<void> {
    try {
      this.parroquias.set(await this.recintos.listarParroquias());
    } catch {
      this.error.set('No se pudieron cargar las parroquias.');
    } finally {
      this.cargandoParroquias.set(false);
    }
  }

  async guardar(): Promise<void> {
    if (this.cargando() || this.cargandoParroquias()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    try {
      const v = this.form.getRawValue();
      const cantidad = Number(v.cantidad_jrv);
      await this.recintos.crear({
        parroquia_id: Number(v.parroquia_id),
        nombre: v.nombre,
        cantidad_jrv: cantidad,
      });
      this.guardado.emit(cantidad);
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
