import { Routes } from '@angular/router';
import { Inicio } from './components/inicio/inicio';
import { HeaderComponent } from './components/header/header';
import { Nav } from './components/nav/nav';
import { FooterComponent } from './components/footer/footer';
import { IndexComponent } from './page/index';
import { Usuario } from './page/usuario/usuario';
import { Ventas } from './page/ventas/ventas';
import { Reportes } from './page/reportes/reportes';
import path from 'path';
import { Notfound } from './page/notfound/notfound';


export const routes: Routes = [
    {path: '', component:IndexComponent},
    {path: 'ventas', component:Ventas},
    {path: 'usuario', component:Usuario},
    {path: 'reportes', component:Reportes},
    {path: '**', component:Notfound}
];
