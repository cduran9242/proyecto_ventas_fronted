import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  ruta: string;
  icono: string;
  texto: string;
  descripcion: string;
  exact?: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class MenuComponent {
  menuAbierto = false;

  menuItems: MenuItem[] = [
    {
      ruta: '/principal',
      icono: '🏠',
      texto: 'Principal',
      descripcion: 'Panel principal del sistema',
      exact: true
    },
    {
      ruta: '/inicio',
      icono: '📌',
      texto: 'Inicio',
      descripcion: 'Información general del proyecto'
    },
    {
      ruta: '/usuario',
      icono: '👥',
      texto: 'Usuarios',
      descripcion: 'Gestión de usuarios registrados'
    },
    {
      ruta: '/roles',
      icono: '🛡️',
      texto: 'Roles',
      descripcion: 'Administración de roles y permisos'
    },
    {
      ruta: '/modulos',
      icono: '🧩',
      texto: 'Módulos',
      descripcion: 'Configuración y control de módulos del sistema'
    },
    {
      ruta: '/productos',
      icono: '📦',
      texto: 'Productos',
      descripcion: 'Gestión del catálogo de productos'
    },
    {
      ruta: '/ventas',
      icono: '💰',
      texto: 'Ventas',
      descripcion: 'Registro y control de ventas'
    },
    {
      ruta: '/reportes',
      icono: '📊',
      texto: 'Reportes',
      descripcion: 'Consultas e informes del sistema'
    }
  ];

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }
}
