import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';

interface MenuNode {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuNode[];
  description?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class MenuComponent {
  isCollapsed = false;
  menuAbierto = false;
  expandedIds = new Set<string>();

  readonly menuTree: MenuNode[] = [
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: '👥',
      description: 'Gestión de usuarios y roles',
      children: [
        {
          id: 'usuarios-gestion',
          label: 'Gestión de Usuarios',
          icon: '👤',
          route: '/usuario',
          description: 'Alta, baja y actualización de usuarios'
        },
        {
          id: 'usuarios-roles',
          label: 'Roles',
          icon: '🛡️',
          route: '/roles',
          description: 'Asignación de permisos y perfiles'
        }
      ]
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: '📦',
      description: 'Administración del catálogo de productos',
      children: [
        {
          id: 'inventario-productos',
          label: 'Productos',
          icon: '📋',
          route: '/productos',
          description: 'Catálogo, existencias y precios'
        }
      ]
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: '💰',
      description: 'Procesos de venta y seguimiento',
      children: [
        {
          id: 'ventas-gestion',
          label: 'Gestión de Ventas',
          icon: '🧾',
          route: '/ventas',
          description: 'Registro y seguimiento de ventas'
        },
        {
          id: 'ventas-analitica',
          label: 'Analítica y Reportes',
          icon: '📈',
          children: [
            {
              id: 'ventas-reportes',
              label: 'Reportes',
              icon: '📊',
              route: '/reportes',
              description: 'Consultas y reportes personalizables'
            },
            {
              id: 'ventas-reportes-avanzados',
              label: 'Reportes Avanzados',
              icon: '🧠',
              children: [
                {
                  id: 'ventas-reportes-resumen',
                  label: 'Resumen Gerencial',
                  icon: '🗂️',
                  route: '/reportes',
                  description: 'Indicadores clave para dirección'
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  constructor(private router: Router) {
    this.expandToRoute(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.expandToRoute(event.urlAfterRedirects ?? event.url);
      });
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleItem(item: MenuNode, event: Event): void {
    event.stopPropagation();
    if (!item.children?.length) {
      this.navigateTo(item);
      return;
    }

    if (this.expandedIds.has(item.id)) {
      this.expandedIds.delete(item.id);
    } else {
      this.expandedIds.add(item.id);
    }
  }

  onItemClick(item: MenuNode, event: Event): void {
    if (item.children?.length) {
      this.toggleItem(item, event);
    } else {
      this.navigateTo(item);
    }
  }

  isExpanded(item: MenuNode): boolean {
    return this.expandedIds.has(item.id);
  }

  isActive(item: MenuNode): boolean {
    if (!item.route) {
      return false;
    }
    const current = this.router.url.split('?')[0]?.split('#')[0];
    return current === item.route;
  }

  private navigateTo(item: MenuNode): void {
    if (item.route) {
      this.router.navigate([item.route]);
      this.cerrarMenu();
    }
  }

  private expandToRoute(url?: string | null): void {
    if (!url) {
      return;
    }
    const cleaned = url.split('?')[0]?.split('#')[0] ?? url;
    const path = this.findPathByRoute(this.menuTree, cleaned);
    if (path) {
      this.expandedIds = new Set(path);
    }
  }

  private findPathByRoute(nodes: MenuNode[], route: string, path: string[] = []): string[] | null {
    for (const node of nodes) {
      const newPath = [...path, node.id];
      if (node.route === route) {
        return newPath.filter(id => this.hasChildren(id));
      }
      if (node.children) {
        const found = this.findPathByRoute(node.children, route, newPath);
        if (found) {
          return found.filter(id => this.hasChildren(id));
        }
      }
    }
    return null;
  }

  private hasChildren(id: string): boolean {
    const node = this.findNodeById(this.menuTree, id);
    return !!node?.children?.length;
  }

  private findNodeById(nodes: MenuNode[], id: string): MenuNode | undefined {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }
}
