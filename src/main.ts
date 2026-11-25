import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, alertCircleOutline, archiveOutline, arrowBackOutline, arrowForwardOutline, barChartOutline, businessOutline,
  checkmarkCircleOutline, clipboardOutline, documentTextOutline, imageOutline, layersOutline, locationOutline,
  logOutOutline, personAddOutline, personOutline, refreshOutline, timeOutline,
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

addIcons({
  addCircleOutline, alertCircleOutline, archiveOutline, arrowBackOutline, arrowForwardOutline, barChartOutline, businessOutline,
  checkmarkCircleOutline, clipboardOutline, documentTextOutline, imageOutline, layersOutline, locationOutline,
  logOutOutline, personAddOutline, personOutline, refreshOutline, timeOutline,
});

const arranque = bootstrapApplication(AppComponent, appConfig);
if (Capacitor.isNativePlatform()) {
  void arranque.then(
    () => requestAnimationFrame(() => { void SplashScreen.hide().catch(console.error); }),
    () => { void SplashScreen.hide().catch(console.error); },
  );
}
void arranque.catch(console.error);
