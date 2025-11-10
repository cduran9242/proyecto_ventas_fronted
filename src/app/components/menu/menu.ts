import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

  menuAbierto = false;

  baseItems: MenuItem[] = [];
  menuTree: MenuItemNode[] = [];
  private expandedNodes = new Set<number>();
  private lockedExpanded = new Set<number>();

  ngOnInit(): void {
    this.sessionSub = this.authService.session$.subscribe(session => {
      this.actualizarMenu(session);
    });
    this.actualizarMenu(this.authService.getSession());
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

  resolverRuta(node: MenuItemNode): string | null {
    const rawRoute = node.ruta?.trim();
    if (rawRoute) {
      return rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
    }
    return null;
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

    if (session?.rol?.nombre?.toLowerCase().includes('admin')) {
      this.baseItems.push({
        ruta: '/menu-config',
        texto: 'Configurar menú',
        descripcion: 'Administración de rutas y accesos'
      });
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
