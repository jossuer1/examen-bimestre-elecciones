import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type FormControl } from '@angular/forms';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { IonButton, IonCard, IonIcon, IonSkeletonText } from '@ionic/angular';

import { mensajeError } from '../../../core/errors/errores';
import type { Cargo } from '../../../shared/models/electoral.model';
import type { ActaMesa } from '../models/acta.model';
import { ActasService } from '../services/actas.service';

const validarCantidad = [
  Validators.required,
  Validators.min(0),
  Validators.max(2147483647),
  Validators.pattern(/^\d+$/),
];

@Component({
  selector: 'app-formulario-acta',
  imports: [ReactiveFormsModule, IonButton, IonCard, IonIcon, IonSkeletonText],
  styles: `
    fieldset {
      display: grid;
      gap: var(--ce-space-3);
      margin: 0;
    }
    label {
      display: grid;
      gap: var(--ce-space-1);
      font-weight: 650;
    }
    .ce-number-field {
      position: relative;
      min-width: 0;
      padding-top: var(--ce-space-2);
    }
    .ce-number-field > span {
      position: absolute;
      top: 0;
      inset-inline-start: 10px;
      max-width: calc(100% - 20px);
      padding: 0 var(--ce-space-1);
      color: var(--ce-muted);
      background: var(--ce-surface);
      font-size: .79rem;
      line-height: 1.1;
      pointer-events: none;
    }
    input[type='number'] {
      width: 100%;
      min-height: 48px;
      padding: var(--ce-space-3);
      color: var(--ce-ink);
      background: var(--ce-surface);
      border: 1px solid var(--ce-control);
      border-radius: var(--ce-radius-small);
      font: inherit;
    }
    input[type='number']:focus-visible { outline: 2px solid var(--ion-color-primary); outline-offset: -1px; }
    input[type='file'] {
      width: 100%;
      padding: var(--ce-space-2);
      background: var(--ce-surface);
      border: 1px dashed var(--ce-control);
      border-radius: var(--ce-radius-small);
      color: var(--ce-muted);
      font-size: .85rem;
    }
    input[type='file']::file-selector-button {
      min-height: 40px;
      margin-inline-end: var(--ce-space-2);
      padding-inline: var(--ce-space-2);
      border: 0;
      border-radius: 8px;
      background: var(--ce-primary-soft);
      color: var(--ion-color-primary);
      font: inherit;
      font-weight: 700;
    }
  `,
  template: `
    @if (cargando()) {
      <ion-card class="ce-card ce-skeleton" role="status" aria-label="Cargando candidaturas"><ion-skeleton-text animated /><ion-skeleton-text animated /></ion-card>
    } @else if (candidaturas().length === 0) {
      <div class="ce-state" [class.ce-state--error]="error()">
      <ion-icon [name]="error() ? 'alert-circle-outline' : 'archive-outline'" aria-hidden="true" />
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      } @else {
        <p>No hay candidaturas para este cargo.</p>
      }
      <ion-button fill="outline" (click)="cargar()">Reintentar</ion-button>
      </div>
    } @else {
      <form class="ce-form ce-acta-form" [formGroup]="form" (ngSubmit)="guardar()">
        <fieldset>
          <legend>Resultados</legend>
          <label class="ce-number-field"><span>Total de sufragantes</span><input type="number" min="0" step="1" formControlName="sufragantes" /></label>
          @if (form.controls.sufragantes.touched && form.controls.sufragantes.invalid) {
            <span class="ce-field-error">Ingresa un entero no negativo.</span>
          }
          <label class="ce-number-field"><span>Votos blancos</span><input type="number" min="0" step="1" formControlName="blancos" /></label>
          @if (form.controls.blancos.touched && form.controls.blancos.invalid) {
            <span class="ce-field-error">Ingresa un entero no negativo.</span>
          }
          <label class="ce-number-field"><span>Votos nulos</span><input type="number" min="0" step="1" formControlName="nulos" /></label>
          @if (form.controls.nulos.touched && form.controls.nulos.invalid) {
            <span class="ce-field-error">Ingresa un entero no negativo.</span>
          }
        </fieldset>
        <fieldset formArrayName="votos">
          <legend>Votos por candidatura</legend>
          @for (candidatura of candidaturas(); track candidatura.id; let i = $index) {
            <label class="ce-number-field"><span>{{ candidatura.candidato }}</span><input type="number" min="0" step="1" [formControlName]="i" /></label>
            @if (form.controls.votos.at(i).touched && form.controls.votos.at(i).invalid) {
              <span class="ce-field-error">Ingresa un entero no negativo.</span>
            }
          }
        </fieldset>

        @if (vistaPrevia(); as url) {
          <img [src]="url" alt="Vista previa de la fotografía del acta" />
          <p>Comprueba que se lean todos los datos de la hoja.</p>
        }
        @if (edicion()) {
          <p>Si quieres conservar la fotografía actual, deja este campo sin cambios.</p>
        }
        @if (nativo) {
          <ion-button type="button" fill="outline" [disabled]="ocupado()" (click)="tomarFoto()">
            {{ foto() ? 'Repetir foto' : 'Tomar foto' }}
          </ion-button>
        } @else {
          <label>
            Fotografía del acta (hasta 6 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              [disabled]="ocupado()"
              (change)="elegirFoto($event)"
            />
          </label>
        }
        @if (!edicion()) {
          <p id="aviso-ubicacion">Tu ubicación actual se guardará junto con el acta. Es obligatoria para registrarla.</p>
          <ion-button
            type="button"
            fill="outline"
            aria-describedby="aviso-ubicacion"
            [disabled]="ocupado()"
            (click)="obtenerUbicacion()"
          >
              <ion-icon slot="start" name="location-outline" aria-hidden="true" />
            Obtener ubicación
          </ion-button>
          @if (avisoUbicacion()) {
            <p class="ce-alert" [class.ce-alert--success]="avisoUbicacion() === 'Ubicación añadida.'" role="status">{{ avisoUbicacion() }}</p>
          }
        }
        <div class="ce-sticky-actions">
          @if (error()) {
            <p class="ce-alert" role="alert">{{ error() }}</p>
          }
          <ion-button type="submit" [disabled]="ocupado()">
            <ion-icon slot="start" name="checkmark-circle-outline" aria-hidden="true" />
            {{ guardando() ? 'Guardando…' : edicion() ? 'Guardar corrección' : 'Guardar acta' }}
          </ion-button>
        </div>
      </form>
    }
  `,
})
export class FormularioActaComponent implements OnInit {
  private readonly actas = inject(ActasService);
  private readonly fb = inject(FormBuilder);
  private ubicacion: { latitude: number; longitude: number } | null = null;

  readonly mesaId = input.required<number>();
  readonly cargo = input.required<Cargo>();
  readonly edicion = input<ActaMesa | null>(null);
  readonly guardada = output<void>();
  readonly ocupacion = output<boolean>();
  readonly nativo = Capacitor.isNativePlatform();
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly ocupado = signal(false);
  readonly candidaturas = signal<{ id: number; candidato: string }[]>([]);
  readonly foto = signal<Blob | null>(null);
  readonly vistaPrevia = signal('');
  readonly avisoUbicacion = signal('');
  readonly error = signal('');

  readonly form = this.fb.group({
    sufragantes: this.fb.control<number | null>(null, validarCantidad),
    blancos: this.fb.control<number | null>(null, validarCantidad),
    nulos: this.fb.control<number | null>(null, validarCantidad),
    votos: this.fb.array<FormControl<number | null>>([]),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => URL.revokeObjectURL(this.vistaPrevia()));
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const candidaturas = await this.actas.candidaturas(this.cargo());
      const edicion = this.edicion();
      const votos = new Map(edicion?.votos.map((voto) => [voto.candidatura_id, voto.votos]));
      if (edicion) {
        this.form.patchValue({ sufragantes: edicion.sufragantes, blancos: edicion.blancos, nulos: edicion.nulos });
      }
      this.form.controls.votos.clear();
      this.form.controls.votos.push(
        candidaturas.map((c) => this.fb.control<number | null>(votos.get(c.id) ?? null, validarCantidad)),
      );
      this.candidaturas.set(candidaturas);
    } catch {
      this.error.set('No se pudieron cargar las candidaturas.');
    } finally {
      this.cargando.set(false);
    }
  }

  elegirFoto(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const foto = campo.files?.[0];
    if (foto) this.prepararFoto(foto);
    campo.value = '';
  }

  async tomarFoto(): Promise<void> {
    this.marcarOcupado(true);
    try {
      const foto = await Camera.takePhoto({ quality: 85, targetWidth: 2400, targetHeight: 2400, saveToGallery: false });
      if (!foto.webPath) throw new Error('La cámara no devolvió una fotografía.');
      const respuesta = await fetch(foto.webPath);
      if (!respuesta.ok) throw new Error('No se pudo leer la fotografía.');
      this.prepararFoto(await respuesta.blob());
    } catch {
      this.error.set('No se pudo obtener la fotografía. Revisa los permisos o intenta de nuevo.');
    } finally {
      this.marcarOcupado(false);
    }
  }

  async obtenerUbicacion(): Promise<void> {
    this.error.set('');
    this.avisoUbicacion.set('Obteniendo ubicación…');
    this.marcarOcupado(true);
    try {
      this.ubicacion = (await Geolocation.getCurrentPosition({ timeout: 10000 })).coords;
      this.avisoUbicacion.set('Ubicación añadida.');
    } catch {
      this.avisoUbicacion.set(
        this.ubicacion
          ? 'Se conserva la ubicación anterior.'
          : 'No se pudo obtener tu ubicación. Activa el GPS, permite el acceso y vuelve a intentarlo.',
      );
    } finally {
      this.marcarOcupado(false);
    }
  }

  async guardar(): Promise<void> {
    if (this.ocupado() || this.cargando() || this.candidaturas().length === 0) return;
    this.error.set('');
    if (this.form.invalid) {
      this.error.set('Completa todas las cantidades con números enteros. Usa 0 donde corresponda.');
      return;
    }
    const valores = this.form.getRawValue();
    const votos = this.candidaturas().map((c, i) => ({ candidatura_id: c.id, votos: Number(valores.votos[i]) }));
    const blancos = Number(valores.blancos);
    const nulos = Number(valores.nulos);
    const sufragantes = Number(valores.sufragantes);
    const conteo = { sufragantes, blancos, nulos, votos };
    const edicion = this.edicion();
    const foto = this.foto();
    this.marcarOcupado(true);
    this.guardando.set(true);
    try {
      if (edicion) {
        await this.actas.corregir(edicion.id, conteo, foto);
      } else {
        await this.actas.registrar(
          { ...conteo, mesa_id: this.mesaId(), cargo: this.cargo() },
          foto,
          this.ubicacion,
        );
      }
      this.guardada.emit();
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.guardando.set(false);
      this.marcarOcupado(false);
    }
  }

  private prepararFoto(foto: Blob): void {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type) || !foto.size || foto.size > 6 * 1024 * 1024) {
      this.error.set('Elige una imagen JPEG, PNG o WebP de hasta 6 MB.');
      return;
    }
    URL.revokeObjectURL(this.vistaPrevia());
    this.vistaPrevia.set(URL.createObjectURL(foto));
    this.foto.set(foto);
    this.error.set('');
  }

  private marcarOcupado(ocupado: boolean): void {
    this.ocupado.set(ocupado);
    this.ocupacion.emit(ocupado);
  }
}
