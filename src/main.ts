import 'zone.js';                           // <--- añade esta línea
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';   // si aún no lo importabas

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
