import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, SessionData } from '../../services/auth.service';
import { RolModulo } from '../../services/api.service';

interface ModuloTarjeta {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  acciones: string[];
}

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, NgFor, RouterModule],
  templateUrl: './principal.html',
  styleUrl: './principal.css'
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private sessionSub?: Subscription;

  proyectoInfo = {
    nombre: 'Sistema de Gestión de Ventas',
    version: '1.0.0',
    descripcion: 'Sistema integral para la gestión de ventas, usuarios, productos y reportes',
    desarrolladores: ['Ciro Durán', 'Anders Muñoz'],
    fecha: new Date().getFullYear()
  };

  modulos: ModuloTarjeta[] = [];

  ngOnInit(): void {
    this.sessionSub = this.authService.session$.subscribe(session => {
      this.modulos = this.mapearModulos(session);
    });
    this.modulos = this.mapearModulos(this.authService.getSession());
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  private obtenerIcono(nombreModulo?: string): string {
    if (!nombreModulo) {
      return '🧩';
    }

    const normalizado = nombreModulo.toLowerCase();
    if (normalizado.includes('usuario')) return '👥';
    if (normalizado.includes('venta')) return '💰';
    if (normalizado.includes('producto')) return '📦';
    if (normalizado.includes('reporte')) return '📊';
    if (normalizado.includes('inventario')) return '🏬';
    if (normalizado.includes('logística') || normalizado.includes('logistica')) return '🚚';
    if (normalizado.includes('administración') || normalizado.includes('administracion')) return '🛠️';
    return '🧩';
  }

  private mapearModulos(session: SessionData | null): ModuloTarjeta[] {
    const modulos = session?.modulos ?? [];
    if (!modulos.length) {
      return [
        {
          titulo: 'Bienvenido',
          descripcion: 'Tu sesión está activa. Solicita permisos al administrador para acceder a módulos.',
          icono: '👋',
          ruta: '/principal',
          acciones: []
        }
      ];
    }

    return modulos.map(modulo => {
      const ruta = this.resolverRuta(modulo);
      return {
        titulo: modulo.nombre_modulo ?? `Módulo ${modulo.modulo_id}`,
        descripcion: modulo.descripcion ?? 'Módulo del sistema',
        icono: this.obtenerIcono(modulo.nombre_modulo),
        ruta,
        acciones: modulo.permisos ?? ['ver']
      };
    });
  }

  private resolverRuta(modulo: RolModulo): string {
    const nombre = modulo.nombre_modulo?.toLowerCase() ?? '';
    const ruta = (modulo.ruta ?? '').toLowerCase();

    if (ruta.includes('usuario') || nombre.includes('usuario')) {
      return '/usuario';
    }
    if (ruta.includes('venta') || nombre.includes('comercial') || nombre.includes('venta')) {
      return '/ventas';
    }
    if (ruta.includes('inventario') || nombre.includes('inventario')) {
      return '/productos';
    }
    if (ruta.includes('rol') || ruta.includes('admin') || nombre.includes('administr')) {
      return '/roles';
    }
    if (ruta.includes('reporte') || nombre.includes('reporte')) {
      return '/reportes';
    }

    const rutaNormalizada = modulo.ruta ?? '/principal';
    return rutaNormalizada.startsWith('/') ? rutaNormalizada : `/${rutaNormalizada}`;
  }
}
