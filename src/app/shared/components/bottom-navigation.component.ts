import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonFooter, IonIcon, IonToolbar } from '@ionic/angular';

export interface BottomNavigationItem {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
  color?: string;
}

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [IonFooter, IonToolbar, IonIcon],
  template: `
    <ion-footer class="ce-bottom-nav">
      <ion-toolbar>
        <nav class="ce-bottom-nav__actions" aria-label="Acciones de la pantalla">
          @for (item of items; track item.id) {
            <button
              type="button"
              class="ce-bottom-nav__button"
              [disabled]="item.disabled ?? false"
              [class.ce-bottom-nav__active]="item.active ?? false"
              [attr.aria-current]="item.active ? 'page' : null"
              (click)="seleccion.emit(item.id)"
            >
              <span class="ce-bottom-nav__icon" [class.ce-bottom-nav__icon--muted]="item.color === 'medium'">
                <ion-icon [name]="item.icon" aria-hidden="true" />
              </span>
              <span>{{ item.label }}</span>
            </button>
          }
        </nav>
      </ion-toolbar>
    </ion-footer>
  `,
})
export class BottomNavigationComponent {
  @Input({ required: true }) items: readonly BottomNavigationItem[] = [];
  @Output() readonly seleccion = new EventEmitter<string>();
}
