import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, SessionData } from '../../services/auth.service';
import { FavoritoMenuItem, MenuItemNode } from '../../services/api.service';

interface ModuloTarjeta {
  menuItemId: number;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  acciones: string[];
  esFavorito: boolean;
  favoritoId?: number;
  alias?: string | null;
}

interface MenuContextualState {
  visible: boolean;
  x: number;
  y: number;
  modulo: ModuloTarjeta | null;
}

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, RouterModule],
  templateUrl: './principal.html',
  styleUrl: './principal.css'
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private sessionSub?: Subscription;
  private favoritosSub?: Subscription;

  proyectoInfo = {
    nombre: 'Sistema de Gestión de Ventas',
    version: '1.0.0',
    descripcion: 'Sistema integral para la gestión de ventas, usuarios, productos y reportes',
    desarrolladores: ['Ciro Durán', 'Anders Muñoz'],
    fecha: new Date().getFullYear()
  };

  modulos: ModuloTarjeta[] = [];
  favoritos: ModuloTarjeta[] = [];
  private favoritosRaw: FavoritoMenuItem[] = [];
  private favoritosSet = new Set<number>();

  menuContextual: MenuContextualState = {
    visible: false,
    x: 0,
    y: 0,
    modulo: null
  };

  ngOnInit(): void {
    this.sessionSub = this.authService.session$.subscribe(session => {
      this.modulos = this.mapearModulos(session);
      this.favoritos = this.mapearFavoritos(this.favoritosRaw, session);
    });

    const sessionActual = this.authService.getSession();
    this.favoritosRaw = this.authService.getFavoritos();
    this.favoritosSet = new Set(this.favoritosRaw.map(f => f.menu_item_id));
    this.modulos = this.mapearModulos(sessionActual);
    this.favoritos = this.mapearFavoritos(this.favoritosRaw, sessionActual);

    this.favoritosSub = this.authService.favoritos$.subscribe(favoritos => {
      this.favoritosRaw = favoritos ?? [];
      this.favoritosSet = new Set(this.favoritosRaw.map(f => f.menu_item_id));
      const session = this.authService.getSession();
      this.modulos = this.mapearModulos(session);
      this.favoritos = this.mapearFavoritos(this.favoritosRaw, session);
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
    this.favoritosSub?.unsubscribe();
  }

  abrirMenuContextual(evento: MouseEvent, modulo: ModuloTarjeta): void {
    evento.preventDefault();
    this.menuContextual = {
      visible: true,
      x: evento.clientX,
      y: evento.clientY,
      modulo
    };
  }

  agregarFavoritoSeleccionado(): void {
    const modulo = this.menuContextual.modulo;
    if (!modulo) {
      return;
    }
    const alias = modulo.alias ?? modulo.titulo;
    this.authService
      .agregarFavorito(modulo.menuItemId, alias)
      .subscribe({
        next: () => this.cerrarMenuContextual(),
        error: (error) => {
          console.error('No se pudo agregar favorito', error);
          window.alert('No fue posible agregar el favorito. Intenta nuevamente.');
          this.cerrarMenuContextual();
        }
      });
  }

  renombrarFavoritoSeleccionado(): void {
    const modulo = this.menuContextual.modulo;
    if (!modulo?.favoritoId) {
      return;
    }
    const aliasActual = modulo.alias ?? modulo.titulo;
    const alias = window.prompt('Nuevo nombre para el favorito', aliasActual);
    if (alias === null) {
      return;
    }
    const valor = alias.trim();
    if (!valor) {
      window.alert('El nombre del favorito no puede estar vacío.');
      return;
    }
    this.authService
      .actualizarFavorito(modulo.favoritoId, { alias: valor })
      .subscribe({
        next: () => this.cerrarMenuContextual(),
        error: (error) => {
          console.error('No se pudo actualizar el favorito', error);
          window.alert('No fue posible actualizar el favorito. Intenta nuevamente.');
          this.cerrarMenuContextual();
        }
      });
  }

  eliminarFavoritoSeleccionado(): void {
    const modulo = this.menuContextual.modulo;
    if (!modulo?.favoritoId) {
      return;
    }
    const confirmado = window.confirm('¿Deseas quitar este favorito?');
    if (!confirmado) {
      return;
    }
    this.authService.eliminarFavorito(modulo.favoritoId).subscribe({
      next: () => this.cerrarMenuContextual(),
      error: (error) => {
        console.error('No se pudo eliminar el favorito', error);
        window.alert('No fue posible eliminar el favorito. Intenta nuevamente.');
        this.cerrarMenuContextual();
      }
    });
  }

  esFavorito(menuItemId: number): boolean {
    return this.favoritosSet.has(menuItemId);
  }


  @HostListener('document:click')
  onClickDocumento(): void {
    this.cerrarMenuContextual();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.cerrarMenuContextual();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrarMenuContextual();
  }

  private cerrarMenuContextual(): void {
    if (this.menuContextual.visible) {
      this.menuContextual = { visible: false, x: 0, y: 0, modulo: null };
    }
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

    return modulos
      .filter(modulo => !!this.resolverRuta(modulo))
      .map(modulo => {
        const ruta = this.resolverRuta(modulo) ?? '/principal';
        const esFavorito = this.esFavorito(modulo.id);
        const favorito = this.favoritosRaw.find(f => f.menu_item_id === modulo.id);
        return {
          menuItemId: modulo.id,
          titulo: favorito?.alias ?? modulo.nombre ?? `Módulo ${modulo.id}`,
          descripcion: favorito?.descripcion_menu ?? modulo.descripcion ?? 'Módulo del sistema',
          icono: favorito?.icono || this.obtenerIcono(modulo.nombre),
          ruta,
          acciones: favorito?.permisos ?? modulo.permisos ?? ['ver'],
          esFavorito,
          favoritoId: favorito?.id,
          alias: favorito?.alias ?? null
        };
      });
  }

  private mapearFavoritos(favoritos: FavoritoMenuItem[], session: SessionData | null): ModuloTarjeta[] {
    const menu = session?.menu ?? [];
    const mapaMenu = this.mapearMenuPorId(menu);
    return favoritos.map(favorito => {
      const nodo = mapaMenu.get(favorito.menu_item_id);
      const ruta = favorito.ruta || this.resolverRuta(nodo ?? null);
      const icono = favorito.icono || this.obtenerIcono(favorito.alias || favorito.nombre_menu);
      const descripcion = favorito.descripcion_menu || nodo?.descripcion || 'Acceso rápido';
      const acciones = favorito.permisos?.length ? favorito.permisos : nodo?.permisos ?? ['ver'];
      return {
        menuItemId: favorito.menu_item_id,
        titulo: favorito.alias ?? favorito.nombre_menu ?? nodo?.nombre ?? `Módulo ${favorito.menu_item_id}`,
        descripcion,
        icono,
        ruta: ruta || '/principal',
        acciones,
        esFavorito: true,
        favoritoId: favorito.id,
        alias: favorito.alias ?? null
      };
    });
  }

  private mapearMenuPorId(nodos: MenuItemNode[]): Map<number, MenuItemNode> {
    const mapa = new Map<number, MenuItemNode>();
    const recorrer = (items: MenuItemNode[]) => {
      items.forEach(item => {
        mapa.set(item.id, item);
        if (item.hijos?.length) {
          recorrer(item.hijos);
        }
      });
    };
    recorrer(nodos);
    return mapa;
  }

  private resolverRuta(modulo: MenuItemNode | null): string {
    if (!modulo) {
      return '';
    }
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
