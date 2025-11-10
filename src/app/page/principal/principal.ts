import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, SessionData } from '../../services/auth.service';
import { MenuItemNode } from '../../services/api.service';

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
    const menu = session?.menu ?? [];
    const modulos = this.obtenerNivelUno(menu);
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

    return modulos
      .filter(modulo => !!this.resolverRuta(modulo))
      .map(modulo => {
        const ruta = this.resolverRuta(modulo) ?? '/principal';
        return {
          titulo: modulo.nombre ?? `Módulo ${modulo.id}`,
          descripcion: modulo.descripcion ?? 'Módulo del sistema',
          icono: this.obtenerIcono(modulo.nombre),
          ruta,
          acciones: modulo.permisos ?? ['ver']
        };
      });
  }

  private resolverRuta(modulo: MenuItemNode): string {
    const rawRoute = modulo.ruta?.trim();
    if (rawRoute) {
      const normalizada = rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
      return normalizada.toLowerCase();
    }

    const nombre = modulo.nombre?.toLowerCase() ?? '';

    if (nombre.includes('usuario')) return '/usuario';
    if (nombre.includes('comercial') || nombre.includes('venta')) return '/ventas';
    if (nombre.includes('inventario')) return '/productos';
    if (nombre.includes('rol') || nombre.includes('adminis')) return '/roles';
    if (nombre.includes('reporte')) return '/reportes';

    return '';
  }

  private obtenerNivelUno(nodos: MenuItemNode[]): MenuItemNode[] {
    return nodos
      .filter(node => node.nivel === 1 || !node.parent_id)
      .sort((a, b) => {
        if (a.orden !== b.orden) {
          return a.orden - b.orden;
        }
        return a.nombre.localeCompare(b.nombre);
      });
  }
}
