import { Routes } from '@angular/router';
import { IndexComponent } from './page/index';
import { LoginComponent } from './page/login/login';
import { PrincipalComponent } from './page/principal/principal';
import { UsuarioPage } from './page/usuario/usuario';
import { Ventas } from './page/ventas/ventas';
import { Productos } from './page/productos/productos';
import { Reportes } from './page/reportes/reportes';
import { RolesPage } from './page/roles/roles';
import { Modulos } from './page/modulos/modulos';
import { MenuConfigPage } from './page/menu-config/menu-config';
import { Notfound } from './page/notfound/notfound';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent, data: {breadcrumb: ['Acceso', 'Login']}},
    {
      path: 'inicio',
      component: IndexComponent,
      canActivate: [authGuard],
      data: {breadcrumb: ['Menú Principal', 'Inicio']}
    },
    {
      path: 'principal',
      component: PrincipalComponent,
      canActivate: [authGuard],
      data: {breadcrumb: ['Menú Principal', 'Panel Principal']}
    },
    {
      path: 'ventas',
      component: Ventas,
      canActivate: [authGuard],
      data: {breadcrumb: ['Gestión Comercial', 'Ventas']}
    },
    {
      path: 'usuario',
      component: UsuarioPage,
      canActivate: [authGuard],
      data: {breadcrumb: ['Administración', 'Usuarios']}
    },
    {
      path: 'productos',
      component: Productos,
      canActivate: [authGuard],
      data: {breadcrumb: ['Inventario', 'Productos']}
    },
    {
      path: 'modulos',
      component: Modulos,
      canActivate: [authGuard],
      data: {breadcrumb: ['Administración', 'Módulos del sistema']}
    },
    {
      path: 'reportes',
      component: Reportes,
      canActivate: [authGuard],
      data: {breadcrumb: ['Inteligencia', 'Reportes']}
    },
    {
      path: 'roles',
      component: RolesPage,
      canActivate: [authGuard],
      data: {breadcrumb: ['Administración', 'Roles y permisos']}
    },
    {
      path: 'menu-config',
      component: MenuConfigPage,
      canActivate: [authGuard],
      data: {breadcrumb: ['Administración', 'Configurar menú']}
    },
    {path: '**', component: Notfound, data: {breadcrumb: ['Error', 'No encontrado']}}
];
