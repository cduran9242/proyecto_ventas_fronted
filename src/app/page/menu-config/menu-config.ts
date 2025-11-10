import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Routes } from '@angular/router';

import {
  ApiService,
  MenuAssignmentPayload,
  MenuItemNode,
  MenuItemPayload,
  Modulo,
  Rol
} from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { routes as appRoutes } from '../../app.routes';

interface MenuOption {
  id: number;
  label: string;
  nivel: number;
}

@Component({
  selector: 'app-menu-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu-config.html',
  styleUrl: './menu-config.css'
})
export class MenuConfigPage implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  esAdmin = false;

  menuTree: MenuItemNode[] = [];
  menuOptions: MenuOption[] = [];
  rutasDisponibles: string[] = [];

  roles: Rol[] = [];
  modulos: Modulo[] = [];

  cargandoMenu = false;
  cargandoAccion = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  editando = false;
  elementoEditandoId: number | null = null;
  private descendientesBloqueados = new Set<number>();
  private mapaNodos = new Map<number, MenuItemNode>();

  itemForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(255)]],
    ruta: ['', [Validators.maxLength(255)]],
    icono: ['', [Validators.maxLength(32)]],
    tipo: ['pagina', [Validators.required]],
    modulo_id: [null as number | null],
    parent_id: [null as number | null],
    orden: [0, [Validators.min(0)]],
    estado: ['Activo', [Validators.required]]
  });

  assignmentForm = this.fb.group({
    rol_id: ['', [Validators.required]],
    menu_item_id: ['', [Validators.required]],
    puede_ver: [true],
    puede_crear: [false],
    puede_editar: [false],
    puede_eliminar: [false]
  });

  ngOnInit(): void {
    this.rutasDisponibles = this.obtenerRutasDisponibles(appRoutes);
    this.esAdmin = this.authService.hasRole('admin');
    if (!this.esAdmin) {
      this.mensajeError = 'No cuentas con permisos para configurar el menú.';
      return;
    }
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargarMenu();
    this.apiService.getRoles().subscribe({
      next: roles => (this.roles = roles),
      error: err => console.error('Error cargando roles', err)
    });
    this.apiService.getModulos().subscribe({
      next: modulos => (this.modulos = modulos),
      error: err => console.error('Error cargando módulos', err)
    });
  }

  cargarMenu(): void {
    this.cargandoMenu = true;
    this.apiService.getMenuTree().subscribe({
      next: tree => {
        this.menuTree = tree;
        this.mapaNodos = this.obtenerMapa(tree);
        this.menuOptions = this.plancharMenu(tree);
        this.cargandoMenu = false;
        if (this.editando && this.elementoEditandoId) {
          const nodoEdit = this.mapaNodos.get(this.elementoEditandoId);
          if (!nodoEdit) {
            this.cancelarEdicion(false);
          } else {
            this.actualizarBloqueos(nodoEdit);
          }
        }
      },
      error: error => {
        console.error('Error al cargar el menú', error);
        this.mensajeError = 'No se pudo cargar la jerarquía del menú.';
        this.cargandoMenu = false;
      }
    });
  }

  guardarMenuItem(): void {
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const payload = this.transformarItemPayload(this.itemForm.value);
    this.cargandoAccion = true;

    if (this.editando && this.elementoEditandoId) {
      this.apiService.updateMenuItem(this.elementoEditandoId, payload).subscribe({
        next: respuesta => {
          this.mensajeExito = respuesta?.mensaje ?? 'Elemento de menú actualizado.';
          this.cargarMenu();
          this.cancelarEdicion(true);
          this.cargandoAccion = false;
        },
        error: error => {
          console.error('Error al actualizar elemento del menú', error);
          this.mensajeError = error?.error?.detail ?? 'No se pudo actualizar el elemento.';
          this.cargandoAccion = false;
        }
      });
      return;
    }

    this.apiService.createMenuItem(payload).subscribe({
      next: respuesta => {
        this.mensajeExito = respuesta?.mensaje ?? 'Elemento de menú creado.';
        this.resetFormulario();
        this.cargarMenu();
        this.cargandoAccion = false;
      },
      error: error => {
        console.error('Error al crear elemento del menú', error);
        this.mensajeError = error?.error?.detail ?? 'No se pudo crear el elemento del menú.';
        this.cargandoAccion = false;
      }
    });
  }

  asignarPermisos(): void {
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const { rol_id, menu_item_id, puede_ver, puede_crear, puede_editar, puede_eliminar } = this.assignmentForm.value;
    const itemId = Number(menu_item_id);
    const payload: MenuAssignmentPayload = {
      rol_id: Number(rol_id),
      puede_ver: !!puede_ver,
      puede_crear: !!puede_crear,
      puede_editar: !!puede_editar,
      puede_eliminar: !!puede_eliminar
    };

    if (!itemId) {
      this.mensajeError = 'Selecciona un elemento del menú válido.';
      return;
    }

    this.cargandoAccion = true;
    this.apiService.assignMenuItem(itemId, payload).subscribe({
      next: respuesta => {
        this.mensajeExito = respuesta?.mensaje ?? 'Permisos guardados.';
        this.cargandoAccion = false;
        this.cargarMenu();
      },
      error: error => {
        console.error('Error al asignar permisos', error);
        this.mensajeError = error?.error?.detail ?? 'No se pudieron asignar los permisos.';
        this.cargandoAccion = false;
      }
    });
  }

  private transformarItemPayload(value: any): MenuItemPayload {
    const rutaSeleccionada: string = (value.ruta ?? '').trim();
    return {
      nombre: value.nombre,
      descripcion: value.descripcion || undefined,
      ruta: rutaSeleccionada ? rutaSeleccionada : undefined,
      icono: value.icono || undefined,
      tipo: value.tipo || 'pagina',
      modulo_id: value.modulo_id ? Number(value.modulo_id) : undefined,
      parent_id: value.parent_id ? Number(value.parent_id) : undefined,
      orden: value.orden !== null ? Number(value.orden) : undefined,
      estado: value.estado || 'Activo'
    };
  }

  private plancharMenu(nodos: MenuItemNode[], nivel = 1, prefijo = ''): MenuOption[] {
    const resultado: MenuOption[] = [];
    const separador = prefijo ? `${prefijo} › ` : '';

    for (const nodo of nodos) {
      resultado.push({
        id: nodo.id,
        label: `${separador}${nodo.nombre}`,
        nivel
      });
      const hijos = this.plancharMenu(nodo.hijos ?? [], nivel + 1, `${separador}${nodo.nombre}`);
      resultado.push(...hijos);
    }

    return resultado;
  }

  iniciarEdicion(node: MenuItemNode): void {
    this.editando = true;
    this.elementoEditandoId = node.id;
    if (node.ruta && !this.rutasDisponibles.includes(node.ruta)) {
      this.rutasDisponibles = [...this.rutasDisponibles, node.ruta];
    }
    this.actualizarBloqueos(node);
    this.itemForm.patchValue({
      nombre: node.nombre ?? '',
      descripcion: node.descripcion ?? '',
      ruta: node.ruta ?? '',
      icono: node.icono ?? '',
      tipo: node.tipo ?? 'pagina',
      modulo_id: node.modulo_id ?? null,
      parent_id: node.parent_id ?? null,
      orden: node.orden ?? 0,
      estado: node.estado ?? 'Activo'
    });
  }

  cancelarEdicion(limpiarFormulario = true): void {
    this.editando = false;
    this.elementoEditandoId = null;
    this.descendientesBloqueados.clear();
    if (limpiarFormulario) {
      this.resetFormulario();
    }
  }

  eliminarElemento(node: MenuItemNode): void {
    const mensaje = node.hijos?.length
      ? `¿Deseas eliminar "${node.nombre}" y sus ${node.hijos.length} elementos hijos?`
      : `¿Deseas eliminar el elemento "${node.nombre}"?`;

    const confirmado = window.confirm(mensaje);
    if (!confirmado) {
      return;
    }

    this.cargandoAccion = true;
    this.apiService.deleteMenuItem(node.id).subscribe({
      next: respuesta => {
        this.mensajeExito = respuesta?.mensaje ?? 'Elemento eliminado.';
        if (this.elementoEditandoId === node.id) {
          this.cancelarEdicion();
        }
        this.cargarMenu();
        this.cargandoAccion = false;
      },
      error: error => {
        console.error('Error al eliminar elemento del menú', error);
        this.mensajeError = error?.error?.detail ?? 'No se pudo eliminar el elemento.';
        this.cargandoAccion = false;
      }
    });
  }

  esOpcionBloqueada(optionId: number): boolean {
    if (!this.editando || !this.elementoEditandoId) {
      return false;
    }
    return optionId === this.elementoEditandoId || this.descendientesBloqueados.has(optionId);
  }

  private resetFormulario(): void {
    this.itemForm.reset({
      nombre: '',
      descripcion: '',
      ruta: '',
      icono: '',
      tipo: 'pagina',
      modulo_id: null,
      parent_id: null,
      orden: 0,
      estado: 'Activo'
    });
  }

  private actualizarBloqueos(node: MenuItemNode): void {
    this.descendientesBloqueados = new Set(this.obtenerIdsDescendientes(node));
  }

  private obtenerIdsDescendientes(node: MenuItemNode): number[] {
    const ids: number[] = [];
    for (const hijo of node.hijos ?? []) {
      ids.push(hijo.id, ...this.obtenerIdsDescendientes(hijo));
    }
    return ids;
  }

  private obtenerMapa(nodos: MenuItemNode[], mapa = new Map<number, MenuItemNode>()): Map<number, MenuItemNode> {
    for (const nodo of nodos) {
      mapa.set(nodo.id, nodo);
      this.obtenerMapa(nodo.hijos ?? [], mapa);
    }
    return mapa;
  }

  private obtenerRutasDisponibles(routes: Routes, prefix = ''): string[] {
    const rutas: string[] = [];
    const recorrer = (items: Routes, base: string) => {
      for (const route of items) {
        const rutaActual = route.path ? `${base}/${route.path}`.replace(/\/+/g, '/') : base || '/';
        if (route.path && route.path !== '**' && !route.redirectTo) {
          rutas.push(rutaActual === '' ? '/' : rutaActual);
        }
        if (route.children?.length) {
          recorrer(route.children, rutaActual === '/' ? '' : rutaActual);
        }
      }
    };
    recorrer(routes, '');
    return Array.from(new Set(rutas)).sort();
  }
}

