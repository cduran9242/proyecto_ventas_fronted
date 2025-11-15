import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, SessionData } from '../../services/auth.service';
import { MenuItemNode } from '../../services/api.service';

type MenuItem = {
  ruta: string;
  texto: string;
  descripcion: string;
  exact?: boolean;
};

type MenuContextState = {
  visible: boolean;
  x: number;
  y: number;
  nodo: MenuItemNode | null;
};

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class MenuComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private sessionSub?: Subscription;
  private favoritosSub?: Subscription;

  menuAbierto = false;

  baseItems: MenuItem[] = [];
  menuTree: MenuItemNode[] = [];
  private expandedNodes = new Set<number>();
  private lockedExpanded = new Set<number>();
  private favoritosSet = new Set<number>();

  menuContextual: MenuContextState = {
    visible: false,
    x: 0,
    y: 0,
    nodo: null
  };

  ngOnInit(): void {
    this.sessionSub = this.authService.session$.subscribe(session => {
      this.actualizarMenu(session);
    });
    this.actualizarMenu(this.authService.getSession());

    this.favoritosSet = new Set(this.authService.getFavoritos().map(f => f.menu_item_id));
    this.favoritosSub = this.authService.favoritos$.subscribe(favoritos => {
      this.favoritosSet = new Set((favoritos ?? []).map(f => f.menu_item_id));
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
    this.favoritosSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  isExpanded(node: MenuItemNode): boolean {
    return this.expandedNodes.has(node.id);
  }

  toggleNode(node: MenuItemNode, event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.expandedNodes.has(node.id)) {
      this.expandedNodes.delete(node.id);
      this.lockedExpanded.delete(node.id);
    } else {
      this.expandedNodes.add(node.id);
    }
  }

  expandNode(node: MenuItemNode): void {
    this.expandedNodes.add(node.id);
  }

  collapseNode(node: MenuItemNode): void {
    if (this.lockedExpanded.has(node.id)) {
      return;
    }
    this.expandedNodes.delete(node.id);
  }

  puedeNavegar(node: MenuItemNode): boolean {
    const ruta = this.resolverRuta(node);
    return !!ruta && (node.permisos ?? []).includes('ver');
  }

  esFavorito(node: MenuItemNode): boolean {
    return this.favoritosSet.has(node.id);
  }

  abrirMenuContextual(event: MouseEvent, node: MenuItemNode): void {
    if (!this.puedeNavegar(node)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.menuContextual = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodo: node
    };
  }

  agregarFavorito(): void {
    const nodo = this.menuContextual.nodo;
    if (!nodo) {
      return;
    }
    this.authService
      .agregarFavorito(nodo.id, nodo.nombre)
      .subscribe({
        next: () => this.cerrarMenuContextual(),
        error: () => {
          window.alert('No fue posible agregar el favorito. Intenta nuevamente.');
          this.cerrarMenuContextual();
        }
      });
  }

  renombrarFavorito(): void {
    const nodo = this.menuContextual.nodo;
    if (!nodo || !this.esFavorito(nodo)) {
      return;
    }
    const favorito = this.authService.getFavoritos().find(f => f.menu_item_id === nodo.id);
    if (!favorito) {
      return;
    }
    const aliasActual = favorito.alias ?? favorito.nombre_menu ?? nodo.nombre;
    const alias = window.prompt('Nuevo nombre para el favorito', aliasActual);
    if (alias === null) {
      return;
    }
    const valor = alias.trim();
    if (!valor) {
      window.alert('El nombre no puede estar vacío.');
      return;
    }
    this.authService.actualizarFavorito(favorito.id, { alias: valor }).subscribe({
      next: () => this.cerrarMenuContextual(),
      error: () => {
        window.alert('No fue posible actualizar el favorito. Intenta nuevamente.');
        this.cerrarMenuContextual();
      }
    });
  }

  eliminarFavorito(): void {
    const nodo = this.menuContextual.nodo;
    if (!nodo || !this.esFavorito(nodo)) {
      return;
    }
    const favorito = this.authService.getFavoritos().find(f => f.menu_item_id === nodo.id);
    if (!favorito) {
      return;
    }
    const confirmado = window.confirm('¿Deseas quitar este favorito?');
    if (!confirmado) {
      return;
    }
    this.authService.eliminarFavorito(favorito.id).subscribe({
      next: () => this.cerrarMenuContextual(),
      error: () => {
        window.alert('No fue posible eliminar el favorito. Intenta nuevamente.');
        this.cerrarMenuContextual();
      }
    });
  }

  resolverRuta(node: MenuItemNode): string | null {
    const rawRoute = node.ruta?.trim();
    if (rawRoute) {
      return rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
    }
    return null;
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
      this.menuContextual = { visible: false, x: 0, y: 0, nodo: null };
    }
  }

  private actualizarMenu(session: SessionData | null): void {
    this.baseItems = [
      {
        ruta: '/principal',
        texto: 'Home',
        descripcion: 'Panel principal del sistema',
        exact: true
      }
    ];

    const esAdmin = session?.rol?.nombre?.toLowerCase().includes('admin');

    if (esAdmin) {
      this.baseItems.push(
        {
          ruta: '/reportes',
          texto: 'Reportes',
          descripcion: 'Tableros ejecutivos y reportes avanzados'
        },
        {
          ruta: '/menu-config',
          texto: 'Configurar menú',
          descripcion: 'Administración de rutas y accesos'
        }
      );
    }

    this.menuTree = this.construirArbol(session?.menu ?? []);
    this.expandedNodes.clear();
    this.lockedExpanded.clear();
  }

  private construirArbol(nodos: MenuItemNode[]): MenuItemNode[] {
    return nodos
      .map(node => ({
        ...node,
        hijos: this.construirArbol(node.hijos ?? [])
      }))
      .filter(node => {
        const puedeVer = (node.permisos ?? []).includes('ver');
        return puedeVer || (node.hijos ?? []).length > 0;
      })
      .sort((a, b) => {
        if (a.orden !== b.orden) {
          return a.orden - b.orden;
        }
        return a.nombre.localeCompare(b.nombre);
      });
  }

  private autoExpand(nodos: MenuItemNode[]): void {
    for (const nodo of nodos) {
      if ((nodo.hijos ?? []).length) {
        this.autoExpand(nodo.hijos ?? []);
      }
    }
  }
}
