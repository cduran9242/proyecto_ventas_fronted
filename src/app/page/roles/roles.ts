import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, Modulo, Rol, RolModulo } from '../../services/api.service';

interface ModuloFormValue {
  modulo_id: number;
  nombre_modulo: string;
  seleccionado: boolean;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  estado: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesPage implements OnInit {
  rolForm: FormGroup;

  roles: Rol[] = [];
  modulosDisponibles: Modulo[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  rolSeleccionadoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.rolForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(255)]],
      estado: ['Activo', [Validators.required]],
      modulos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.cargarModulos();
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

  get modulosFormArray(): FormArray<FormGroup> {
    return this.rolForm.get('modulos') as FormArray<FormGroup>;
  }

  get modulosControles(): FormGroup[] {
    return this.modulosFormArray.controls as FormGroup[];
  }

  cargarModulos(): void {
    this.cargando = true;
    this.apiService
      .getModulosActivos()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (modulos) => {
          this.modulosDisponibles = modulos ?? [];
          this._crearFormularioModulos();
          this.cargarRoles();
        },
        error: (error) => {
          console.error('Error al cargar módulos:', error);
          this.mensajeError = 'No se pudieron cargar los módulos disponibles.';
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
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.rolForm.invalid) {
      this.rolForm.markAllAsTouched();
      return;
    }

    const modulosSeleccionados = this.modulosControles
      .map(control => control.value as ModuloFormValue)
      .filter(value => value.seleccionado)
      .map(value => {
        const permisos = this._obtenerPermisosDesdeFormulario(value);
        return {
          modulo_id: value.modulo_id,
          permisos,
          estado: value.estado ?? 'Activo'
        };
      });

    const payload: Rol = {
      nombre: this.nombre?.value.trim(),
      descripcion: this.descripcion?.value?.trim() || '',
      estado: this.estado?.value,
      modulos: modulosSeleccionados
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
    this.modoEdicion = true;
    this.rolSeleccionadoId = rol.id ?? null;
    this.mensajeExito = null;
    this.mensajeError = null;

    this.rolForm.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
      estado: rol.estado ?? 'Activo'
    });

    this._aplicarModulosAlFormulario(rol.modulos ?? []);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminarRol(rol: Rol): void {
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

    this.modulosControles.forEach(control => {
      control.patchValue({
        seleccionado: false,
        puede_ver: false,
        puede_crear: false,
        puede_editar: false,
        puede_eliminar: false,
        estado: 'Activo'
      });
    });

    this.rolForm.markAsPristine();
    this.rolForm.markAsUntouched();
  }

  obtenerResumenModulos(modulos: RolModulo[] | undefined): string {
    if (!modulos || modulos.length === 0) {
      return 'Sin módulos';
    }
    return modulos
      .map(modulo => `${modulo.nombre_modulo ?? 'Módulo'} (${(modulo.permisos || []).join(', ') || 'ver'})`)
      .join(' | ');
  }

  private _crearFormularioModulos(): void {
    const modulosArray = this.modulosFormArray;
    modulosArray.clear();

    this.modulosDisponibles.forEach(modulo => {
      modulosArray.push(
        this.fb.group({
          modulo_id: [modulo.id, Validators.required],
          nombre_modulo: [modulo.nombre],
          seleccionado: [false],
          puede_ver: [false],
          puede_crear: [false],
          puede_editar: [false],
          puede_eliminar: [false],
          estado: ['Activo']
        })
      );
    });
  }

  private _aplicarModulosAlFormulario(modulos: RolModulo[]): void {
    const controles = this.modulosControles;
    controles.forEach(control => {
      const moduloAsignado = modulos.find(m => m.modulo_id === control.get('modulo_id')?.value);
      if (moduloAsignado) {
        const permisos = moduloAsignado.permisos ?? [];
        control.patchValue({
          seleccionado: true,
          puede_ver: permisos.includes('ver') || permisos.length === 0,
          puede_crear: permisos.includes('crear'),
          puede_editar: permisos.includes('editar'),
          puede_eliminar: permisos.includes('eliminar'),
          estado: moduloAsignado.estado ?? 'Activo'
        });
      } else {
        control.patchValue({
          seleccionado: false,
          puede_ver: false,
          puede_crear: false,
          puede_editar: false,
          puede_eliminar: false,
          estado: 'Activo'
        });
      }
    });
  }

  private _obtenerPermisosDesdeFormulario(value: ModuloFormValue): string[] {
    const permisos: string[] = [];
    if (value.puede_ver) {
      permisos.push('ver');
    }
    if (value.puede_crear) {
      permisos.push('crear');
    }
    if (value.puede_editar) {
      permisos.push('editar');
    }
    if (value.puede_eliminar) {
      permisos.push('eliminar');
    }

    if (permisos.length === 0) {
      permisos.push('ver');
    }

    return permisos;
  }
}
