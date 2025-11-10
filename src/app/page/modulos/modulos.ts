import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, Modulo } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './modulos.html',
  styleUrl: './modulos.css'
})
export class Modulos implements OnInit, OnDestroy {
  moduloForm: FormGroup;
  modulos: Modulo[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  moduloSeleccionadoId: number | null = null;
  permiteCrear = false;
  permiteEditar = false;
  permiteEliminar = false;

  estadosDisponibles = [
    { valor: 'Activo', texto: 'Activo' },
    { valor: 'Inactivo', texto: 'Inactivo' }
  ];

  private readonly esBrowser: boolean;
  private sessionSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.esBrowser = isPlatformBrowser(this.platformId);
    this.moduloForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      ruta: ['', [Validators.required, Validators.maxLength(120)]],
      estado: ['Activo', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.esBrowser) {
      this.establecerPermisos();
      this.actualizarEstadoFormulario();
      this.sessionSub = this.authService.session$.subscribe(() => {
        this.establecerPermisos();
        this.actualizarEstadoFormulario();
      });
      this.cargarModulos();
    }
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  get nombre() {
    return this.moduloForm.get('nombre');
  }

  get descripcion() {
    return this.moduloForm.get('descripcion');
  }

  get ruta() {
    return this.moduloForm.get('ruta');
  }

  get estado() {
    return this.moduloForm.get('estado');
  }

  cargarModulos(): void {
    if (!this.esBrowser) {
      return;
    }

    this.cargando = true;
    this.mensajeError = null;

    this.apiService
      .getModulos()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (modulos) => {
          this.modulos = modulos ?? [];
        },
        error: (error) => {
          if (error?.status === 404) {
            this.modulos = [];
            this.mensajeError = null;
          } else {
            console.error('Error al cargar módulos:', error);
            this.mensajeError =
              'No se pudieron cargar los módulos. Intenta nuevamente.';
          }
        }
      });
  }

  guardarModulo(): void {
    if (this.moduloForm.invalid) {
      this.moduloForm.markAllAsTouched();
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

    const payload: Modulo = {
      nombre: this.nombre?.value.trim(),
      descripcion: this.descripcion?.value.trim(),
      ruta: this.ruta?.value.trim(),
      estado: this.estado?.value
    };

    this.cargando = true;

    if (this.modoEdicion && this.moduloSeleccionadoId !== null) {
      this.apiService
        .actualizarModulo(this.moduloSeleccionadoId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (respuesta) => {
            this.mensajeExito = respuesta?.mensaje ?? 'Módulo actualizado.';
            this.cancelarEdicion();
            this.cargarModulos();
          },
          error: (error) => {
            console.error('Error al actualizar módulo:', error);
            this.mensajeError =
              error?.error?.detail ??
              'No se pudo actualizar el módulo. Revisa los datos e intenta nuevamente.';
          }
        });
    } else {
      this.apiService
        .crearModulo(payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (respuesta) => {
            this.mensajeExito = respuesta?.mensaje ?? 'Módulo creado.';
            this.resetFormulario();
            this.cargarModulos();
          },
          error: (error) => {
            console.error('Error al crear módulo:', error);
            this.mensajeError =
              error?.error?.detail ??
              'No se pudo crear el módulo. Revisa los datos e intenta nuevamente.';
          }
        });
    }
  }

  editarModulo(modulo: Modulo): void {
    if (!this.permiteEditar) {
      return;
    }

    this.modoEdicion = true;
    this.moduloSeleccionadoId = modulo.id ?? null;
    this.mensajeExito = null;
    this.mensajeError = null;

    this.moduloForm.setValue({
      nombre: modulo.nombre,
      descripcion: modulo.descripcion,
      ruta: modulo.ruta,
      estado: modulo.estado ?? 'Activo'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmarEliminar(modulo: Modulo): void {
    if (!this.permiteEliminar) {
      return;
    }

    const confirmado = window.confirm(
      `¿Deseas eliminar el módulo "${modulo.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmado || modulo.id == null) {
      return;
    }

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    this.apiService
      .eliminarModulo(modulo.id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito = respuesta?.mensaje ?? 'Módulo eliminado.';
          if (this.moduloSeleccionadoId === modulo.id) {
            this.cancelarEdicion();
          }
          this.cargarModulos();
        },
        error: (error) => {
          console.error('Error al eliminar módulo:', error);
          this.mensajeError =
            error?.error?.detail ??
            'No se pudo eliminar el módulo. Intenta nuevamente.';
        }
      });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.moduloSeleccionadoId = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.moduloForm.reset({
      nombre: '',
      descripcion: '',
      ruta: '',
      estado: 'Activo'
    });
    this.moduloForm.markAsPristine();
    this.moduloForm.markAsUntouched();
    this.actualizarEstadoFormulario();
  }

  private establecerPermisos(): void {
    this.permiteCrear = this.tienePermiso('/modulos', 'crear');
    this.permiteEditar = this.tienePermiso('/modulos', 'editar');
    this.permiteEliminar = this.tienePermiso('/modulos', 'eliminar');
  }

  private actualizarEstadoFormulario(): void {
    if (!this.permiteCrear && !this.permiteEditar) {
      this.moduloForm.disable({ emitEvent: false });
    } else {
      this.moduloForm.enable({ emitEvent: false });
    }
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
}

