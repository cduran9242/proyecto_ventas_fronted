import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, MenuItemNode, Rol, RolMenuItemAsignado } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

type MenuPermisoNode = MenuItemNode & {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  hijos?: MenuPermisoNode[];
};

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesPage implements OnInit, OnDestroy {
  rolForm: FormGroup;

  roles: Rol[] = [];
  menuTreeBase: MenuItemNode[] = [];
  menuTreeForm: MenuPermisoNode[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  rolSeleccionadoId: number | null = null;
  permiteCrear = false;
  permiteEditar = false;
  permiteEliminar = false;
  private sessionSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.rolForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(255)]],
      estado: ['Activo', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.establecerPermisos();
    this.sessionSub = this.authService.session$.subscribe(() => {
      this.establecerPermisos();
    });
    this.cargarMenu();
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  get nombre() {
    return this.rolForm.get('nombre');
  }

  get descripcion() {
    return this.rolForm.get('descripcion');
  }

  get estado() {
    return this.rolForm.get('estado');
  }

  cargarMenu(): void {
    this.cargando = true;
    this.apiService
      .getMenuTree()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (menu) => {
          this.menuTreeBase = menu ?? [];
          this.menuTreeForm = this.enriquecerMenu(this.menuTreeBase);
          this.cargarRoles();
        },
        error: (error) => {
          console.error('Error al cargar menú base:', error);
          this.mensajeError = 'No se pudo cargar la jerarquía del menú.';
        }
      });
  }

  cargarRoles(): void {
    this.cargando = true;
    this.mensajeError = null;

    this.apiService
      .getRoles()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (roles) => {
          this.roles = roles ?? [];
        },
        error: (error) => {
          console.error('Error al cargar roles:', error);
          if (error?.status === 404) {
            this.roles = [];
          } else {
            this.mensajeError = 'No se pudieron cargar los roles. Intenta nuevamente.';
          }
        }
      });
  }

  guardarRol(): void {
    if (this.rolForm.invalid) {
      this.rolForm.markAllAsTouched();
      return;
    }

    if (!this.modoEdicion && !this.permiteCrear) {
      return;
    }

    if (this.modoEdicion && !this.permiteEditar) {
      return;
    }

    this.mensajeError = null;
    this.mensajeExito = null;

    const menuAsignaciones = this.obtenerAsignaciones(this.menuTreeForm);

    const payload: Rol = {
      nombre: this.nombre?.value.trim(),
      descripcion: this.descripcion?.value?.trim() || '',
      estado: this.estado?.value,
      modulos: [],
      menu_items: menuAsignaciones
    };

    this.cargando = true;

    if (this.modoEdicion && this.rolSeleccionadoId !== null) {
      this.apiService
        .actualizarRol(this.rolSeleccionadoId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (respuesta) => {
            this.mensajeExito = respuesta?.mensaje ?? 'Rol actualizado correctamente.';
            this.cancelarEdicion();
            this.cargarRoles();
          },
          error: (error) => {
            console.error('Error al actualizar rol:', error);
            this.mensajeError =
              error?.error?.detail ?? 'No se pudo actualizar el rol. Intenta nuevamente.';
          }
        });
    } else {
      this.apiService
        .crearRol(payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (respuesta) => {
            this.mensajeExito = respuesta?.mensaje ?? 'Rol creado correctamente.';
            this.resetFormulario();
            this.cargarRoles();
          },
          error: (error) => {
            console.error('Error al crear rol:', error);
            this.mensajeError =
              error?.error?.detail ?? 'No se pudo crear el rol. Intenta nuevamente.';
          }
        });
    }
  }

  editarRol(rol: Rol): void {
    if (!this.permiteEditar) {
      return;
    }

    this.modoEdicion = true;
    this.rolSeleccionadoId = rol.id ?? null;
    this.mensajeExito = null;
    this.mensajeError = null;

    this.rolForm.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
      estado: rol.estado ?? 'Activo'
    });

    this.menuTreeForm = this.enriquecerMenu(this.menuTreeBase);
    this.aplicarPermisos(this.menuTreeForm, rol.menu_items ?? []);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminarRol(rol: Rol): void {
    if (!this.permiteEliminar) {
      return;
    }

    if (rol.id == null) {
      return;
    }

    const confirmado = window.confirm(`¿Deseas eliminar el rol "${rol.nombre}"?`);
    if (!confirmado) {
      return;
    }

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    this.apiService
      .eliminarRol(rol.id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito = respuesta?.mensaje ?? 'Rol eliminado correctamente.';
          if (this.rolSeleccionadoId === rol.id) {
            this.cancelarEdicion();
          }
          this.cargarRoles();
        },
        error: (error) => {
          console.error('Error al eliminar rol:', error);
          this.mensajeError =
            error?.error?.detail ?? 'No se pudo eliminar el rol. Intenta nuevamente.';
        }
      });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.rolSeleccionadoId = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.rolForm.reset({
      nombre: '',
      descripcion: '',
      estado: 'Activo'
    });

    this.menuTreeForm = this.enriquecerMenu(this.menuTreeBase);

    this.rolForm.markAsPristine();
    this.rolForm.markAsUntouched();
  }

  obtenerResumenMenu(menuItems: RolMenuItemAsignado[] | undefined): string {
    if (!menuItems || menuItems.length === 0) {
      return 'Sin accesos';
    }

    const totalItems = menuItems.length;
    const totalPermisos = menuItems.reduce((acc, item) => {
      return acc + (item.permisos?.length || 1);
    }, 0);

    const primerosItems = menuItems.slice(0, 2).map((item) => {
      const nombre = item.nombre_menu ?? `Elemento ${item.menu_item_id}`;
      const permisos = item.permisos?.length ? item.permisos.length : 1;
      return `${nombre} (${permisos} permiso${permisos > 1 ? 's' : ''})`;
    }).join(' • ');

    const restantes = totalItems - 2;
    if (restantes > 0) {
      return `${primerosItems} +${restantes} más`;
    }
    return primerosItems;
  }

  onPermisoChange(node: MenuPermisoNode, permiso: 'ver' | 'crear' | 'editar' | 'eliminar', checked: boolean): void {
    if (!this.permiteCrear && !this.permiteEditar) {
      return;
    }

    node[permiso] = checked;

    if ((permiso === 'crear' || permiso === 'editar' || permiso === 'eliminar') && checked) {
      node.ver = true;
    }

    if (permiso === 'ver' && !checked) {
      node.crear = false;
      node.editar = false;
      node.eliminar = false;
    }
  }

  private establecerPermisos(): void {
    this.permiteCrear = this.tienePermiso('/roles', 'crear');
    this.permiteEditar = this.tienePermiso('/roles', 'editar');
    this.permiteEliminar = this.tienePermiso('/roles', 'eliminar');

    this.actualizarEstadoFormulario();
  }

  private tienePermiso(ruta: string, permiso: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean {
    const servicio = this.authService as any;

    if (typeof servicio?.hasPermission === 'function') {
      return servicio.hasPermission(ruta, permiso);
    }

    const permisos = new Set<string>(
      servicio?.getPermisosDeRuta?.(ruta)?.map((p: string) =>
        p ? p.toLowerCase() : p
      ) ?? []
    );
    return permiso === 'ver' ? permisos.has('ver') || permisos.size > 0 : permisos.has(permiso);
  }

  private actualizarEstadoFormulario(): void {
    if (!this.permiteCrear && !this.permiteEditar) {
      this.rolForm.disable({ emitEvent: false });
    } else {
      this.rolForm.enable({ emitEvent: false });
    }
  }

  private enriquecerMenu(nodos: MenuItemNode[] | undefined): MenuPermisoNode[] {
    if (!nodos || !nodos.length) {
      return [];
    }
    return nodos.map((nodo) => ({
      ...nodo,
      ver: false,
      crear: false,
      editar: false,
      eliminar: false,
      hijos: this.enriquecerMenu(nodo.hijos)
    }));
  }

  private aplicarPermisos(nodos: MenuPermisoNode[] | undefined, asignaciones: RolMenuItemAsignado[]): void {
    if (!nodos) {
      return;
    }
    nodos.forEach((nodo) => {
      const asignado = asignaciones.find((item) => item.menu_item_id === nodo.id);
      if (asignado) {
        const permisos = new Set(asignado.permisos ?? []);
        nodo.ver = permisos.has('ver') || permisos.size > 0;
        nodo.crear = permisos.has('crear');
        nodo.editar = permisos.has('editar');
        nodo.eliminar = permisos.has('eliminar');
      } else {
        nodo.ver = false;
        nodo.crear = false;
        nodo.editar = false;
        nodo.eliminar = false;
      }
      this.aplicarPermisos(nodo.hijos, asignaciones);
    });
  }

  private obtenerAsignaciones(nodos: MenuPermisoNode[] | undefined): RolMenuItemAsignado[] {
    if (!nodos) {
      return [];
    }

    const resultado: RolMenuItemAsignado[] = [];

    const recorrer = (items: MenuPermisoNode[] | undefined) => {
      if (!items) {
        return;
      }
      for (const nodo of items) {
        const permisos = this.extraerPermisos(nodo);
        if (permisos.length) {
          resultado.push({
            menu_item_id: nodo.id,
            permisos
          });
        }
        recorrer(nodo.hijos);
      }
    };

    recorrer(nodos);
    return resultado;
  }

  private extraerPermisos(nodo: MenuPermisoNode): string[] {
    const permisos: string[] = [];
    if (nodo.ver) {
      permisos.push('ver');
    }
    if (nodo.crear) {
      permisos.push('crear');
    }
    if (nodo.editar) {
      permisos.push('editar');
    }
    if (nodo.eliminar) {
      permisos.push('eliminar');
    }
    return permisos;
  }
}
