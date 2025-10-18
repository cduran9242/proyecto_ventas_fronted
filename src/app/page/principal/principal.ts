import { Component } from '@angular/core';

@Component({
  selector: 'app-principal',
  standalone: true,
  templateUrl: './principal.html',
  styleUrl: './principal.css'
})
export class PrincipalComponent {
  // Información del proyecto
  proyectoInfo = {
    nombre: 'Sistema de Gestión de Ventas',
    version: '1.0.0',
    descripcion: 'Sistema integral para la gestión de ventas, usuarios, productos y reportes',
    tecnologias: ['Angular 20', 'FastAPI', 'PostgreSQL'],
    desarrollador: 'Estudiante de Desarrollo Web',
    fecha: new Date().getFullYear()
  };

  modulos = [
    {
      titulo: 'Gestión de Usuarios',
      descripcion: 'Administración completa de usuarios del sistema con roles y permisos',
      icono: '👥',
      ruta: '/usuario'
    },
    {
      titulo: 'Módulo de Ventas',
      descripcion: 'Registro y seguimiento de todas las transacciones de venta',
      icono: '💰',
      ruta: '/ventas'
    },
    {
      titulo: 'Gestión de Productos',
      descripcion: 'Catálogo y administración del inventario de productos',
      icono: '📦',
      ruta: '/productos'
    },
    {
      titulo: 'Reportes y Análisis',
      descripcion: 'Generación de reportes detallados y análisis de datos',
      icono: '📊',
      ruta: '/reportes'
    }
  ];
}
