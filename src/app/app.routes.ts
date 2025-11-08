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
    {path: 'login', component: LoginComponent},
    {path: 'inicio', component: IndexComponent},
    {path: 'principal', component: PrincipalComponent},
    {path: 'ventas', component: Ventas},
    {path: 'usuario', component: Usuario},
    {path: 'productos', component: Productos},
    {path: 'reportes', component: Reportes},
    {path: 'roles', component: Roles},
    {path: '**', component: Notfound}
];
