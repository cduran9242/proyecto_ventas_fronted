import { Routes } from '@angular/router';
import { Inicio } from './components/inicio/inicio';
import { Header } from './components/header/header';
import { Nav } from './components/nav/nav';
import { Footer } from './components/footer/footer';
import { Index } from './page/index';
import { Usuario } from './page/usuario/usuario';
import { Ventas } from './page/ventas/ventas';
import { Reportes } from './page/reportes/reportes';
import path from 'path';
import { Notfound } from './page/notfound/notfound';


export const routes: Routes = [
    {path: '', component:Index},
    {path: 'ventas', component:Ventas},
    {path: 'usuario', component:Usuario},
    {path: 'reportes', component:Reportes},
    {path: '**', component:Notfound}
];
