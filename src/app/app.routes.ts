import { Routes } from '@angular/router';
import { IndexComponent } from './page/index';
import { LoginComponent } from './page/login/login';
import { PrincipalComponent } from './page/principal/principal';
import { Usuario } from './page/usuario/usuario';
import { Ventas } from './page/ventas/ventas';
import { Productos } from './page/productos/productos';
import { Reportes } from './page/reportes/reportes';
import { Roles } from './page/roles/roles';
import { Notfound } from './page/notfound/notfound';

export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent, data: {breadcrumb: ['Acceso', 'Login']}},
    {path: 'inicio', component: IndexComponent, data: {breadcrumb: ['Menú Principal', 'Inicio']}},
    {path: 'principal', component: PrincipalComponent, data: {breadcrumb: ['Menú Principal', 'Panel Principal']}},
    {path: 'ventas', component: Ventas, data: {breadcrumb: ['Gestión Comercial', 'Ventas']}},
    {path: 'usuario', component: Usuario, data: {breadcrumb: ['Administración', 'Usuarios']}},
    {path: 'productos', component: Productos, data: {breadcrumb: ['Inventario', 'Productos']}},
    {path: 'reportes', component: Reportes, data: {breadcrumb: ['Inteligencia', 'Reportes']}},
    {path: 'roles', component: Roles, data: {breadcrumb: ['Administración', 'Roles y permisos']}},
    {path: '**', component: Notfound, data: {breadcrumb: ['Error', 'No encontrado']}}
];
