import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class MenuComponent {
  // Items del menú
  menuItems = [
    { 
      ruta: '/principal', 
      texto: '🏠 Principal', 
      descripcion: 'Página principal del sistema' 
    },
    { 
      ruta: '/ventas', 
      texto: '💰 Ventas', 
      descripcion: 'Gestión de ventas' 
    },
    { 
      ruta: '/productos', 
      texto: '📦 Productos', 
      descripcion: 'Catálogo de productos' 
    },
    { 
      ruta: '/usuario', 
      texto: '👥 Usuarios', 
      descripcion: 'Gestión de usuarios' 
    },
    { 
      ruta: '/roles', 
      texto: '🔐 Roles', 
      descripcion: 'Gestión de roles y permisos' 
    },
    { 
      ruta: '/reportes', 
      texto: '📊 Reportes', 
      descripcion: 'Reportes y análisis' 
    }
  ];

  // Estado del menú (para móviles)
  menuAbierto = false;

  // Método para alternar menú en móviles
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // Método para cerrar menú
  cerrarMenu() {
    this.menuAbierto = false;
  }
}
