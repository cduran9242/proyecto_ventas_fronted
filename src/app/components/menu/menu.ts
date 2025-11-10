import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, SessionData } from '../../services/auth.service';
import { RolModulo } from '../../services/api.service';

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
export class MenuComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sessionSub?: Subscription;

  menuAbierto = false;

  menuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.sessionSub = this.authService.session$.subscribe(session => {
      this.menuItems = this.generarMenu(session);
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  private generarMenu(session: SessionData | null): MenuItem[] {
    const baseItems: MenuItem[] = [
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
      }
    ];

    if (!session) {
      return baseItems;
    }

    const modulos = session.modulos ?? [];
    const rutasBase = new Set(baseItems.map(item => item.ruta));
    const modulosMenu = modulos
      .map(modulo => {
        const ruta = this.resolverRuta(modulo);
        return {
          ruta,
          icono: this.obtenerIcono(modulo),
          texto: modulo.nombre_modulo ?? `Módulo ${modulo.modulo_id}`,
          descripcion: modulo.descripcion ?? 'Módulo del sistema'
        } as MenuItem;
      })
      .filter(item => !rutasBase.has(item.ruta));

    return [...baseItems, ...modulosMenu];
  }

  private obtenerIcono(modulo: RolModulo): string {
    return modulo.icono ?? this.obtenerIconoPorNombre(modulo.nombre_modulo);
  }

  private obtenerIconoPorNombre(nombre?: string): string {
    if (!nombre) {
      return '🧩';
    }
    const normalized = nombre.toLowerCase();
    if (normalized.includes('usuario')) return '👥';
    if (normalized.includes('venta')) return '💰';
    if (normalized.includes('producto')) return '📦';
    if (normalized.includes('reporte')) return '📊';
    if (normalized.includes('inventario')) return '🏬';
    if (normalized.includes('logística') || normalized.includes('logistica')) return '🚚';
    if (normalized.includes('administración') || normalized.includes('administracion')) return '🛠️';
    return '🧩';
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
