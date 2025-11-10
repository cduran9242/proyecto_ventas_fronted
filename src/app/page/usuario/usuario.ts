import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, Usuario } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface RolOption {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class UsuarioPage implements OnInit, OnDestroy {
  usuarioForm: FormGroup;
  usuarios: Usuario[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  usuarioSeleccionadoId: number | null = null;

  roles: RolOption[] = [];
  permiteCrear = false;
  permiteEditar = false;
  permiteEliminar = false;
  private sessionSub?: Subscription;

  estados = [
    { valor: 'Activo', texto: 'Activo' },
    { valor: 'Inactivo', texto: 'Inactivo' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.usuarioForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.maxLength(120)]],
      apellidos: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefono: ['', [Validators.required, Validators.maxLength(30)]],
      cedula: ['', [Validators.required, Validators.maxLength(20)]],
      contrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
      rol_id: ['', [Validators.required]],
      estado: ['Activo', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.establecerPermisos();
    this.actualizarEstadoFormulario();
    this.sessionSub = this.authService.session$.subscribe(() => {
      this.establecerPermisos();
      this.actualizarEstadoFormulario();
    });
    this.cargarUsuarios();
    this.cargarRoles();
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  get nombres() {
    return this.usuarioForm.get('nombres');
  }

  get apellidos() {
    return this.usuarioForm.get('apellidos');
  }

  get email() {
    return this.usuarioForm.get('email');
  }

  get telefono() {
    return this.usuarioForm.get('telefono');
  }

  get cedula() {
    return this.usuarioForm.get('cedula');
  }

  get contrasena() {
    return this.usuarioForm.get('contrasena');
  }

  get rol_id() {
    return this.usuarioForm.get('rol_id');
  }

  get estado() {
    return this.usuarioForm.get('estado');
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.mensajeError = null;

    this.apiService
      .getUsuarios()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios ?? [];
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          if (error?.status === 404) {
            this.usuarios = [];
          } else {
            this.mensajeError = 'No se pudieron cargar los usuarios. Intenta nuevamente.';
          }
        }
      });
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
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

    const payload: Usuario = {
      nombres: this.nombres?.value.trim(),
      apellidos: this.apellidos?.value.trim(),
      email: this.email?.value.trim(),
      telefono: this.telefono?.value.trim(),
      cedula: this.cedula?.value.trim(),
      contrasena: this.contrasena?.value,
      rol_id: Number(this.rol_id?.value),
      estado: this.estado?.value
    };

    this.cargando = true;

    if (this.modoEdicion && this.usuarioSeleccionadoId !== null) {
      this.apiService
        .actualizarUsuario(this.usuarioSeleccionadoId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (respuesta) => {
            this.mensajeExito = (respuesta as any)?.mensaje ?? 'Usuario actualizado correctamente.';
            this.cancelarEdicion();
            this.cargarUsuarios();
          },
          error: (error) => {
            console.error('Error al actualizar usuario:', error);
            this.mensajeError =
              error?.error?.detail ?? 'No se pudo actualizar el usuario. Intenta nuevamente.';
          }
        });
    } else {
      this.apiService
        .crearUsuario(payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (respuesta) => {
            this.mensajeExito = (respuesta as any)?.mensaje ?? 'Usuario creado correctamente.';
            this.resetFormulario();
            this.cargarUsuarios();
          },
          error: (error) => {
            console.error('Error al crear usuario:', error);
            this.mensajeError =
              error?.error?.detail ?? 'No se pudo crear el usuario. Intenta nuevamente.';
          }
        });
    }
  }

  editarUsuario(usuario: Usuario): void {
    if (!this.permiteEditar) {
      return;
    }

    this.modoEdicion = true;
    this.usuarioSeleccionadoId = usuario.id ?? null;
    this.mensajeError = null;
    this.mensajeExito = null;

    this.usuarioForm.setValue({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      cedula: usuario.cedula ?? '',
      contrasena: usuario.contrasena ?? '',
      rol_id: usuario.rol_id ?? '',
      estado: usuario.estado ?? 'Activo'
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionadoId = null;
    this.resetFormulario();
  }

  eliminarUsuario(usuario: Usuario): void {
    if (!this.permiteEliminar) {
      return;
    }

    if (usuario.id == null) {
      return;
    }

    const confirmado = window.confirm(
      `¿Confirma eliminar el usuario "${usuario.nombres} ${usuario.apellidos}"?`);

    if (!confirmado) {
      return;
    }

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    this.apiService
      .eliminarUsuario(usuario.id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito = (respuesta as any)?.mensaje ?? 'Usuario eliminado correctamente.';
          if (this.usuarioSeleccionadoId === usuario.id) {
            this.cancelarEdicion();
          }
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.mensajeError =
            error?.error?.detail ?? 'No se pudo eliminar el usuario. Intenta nuevamente.';
        }
      });
  }

  resetFormulario(): void {
    this.usuarioForm.reset({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      cedula: '',
      contrasena: '',
      rol_id: '',
      estado: 'Activo'
    });
    this.usuarioForm.markAsPristine();
    this.usuarioForm.markAsUntouched();
    this.actualizarEstadoFormulario();
  }

  private establecerPermisos(): void {
    this.permiteCrear = this.tienePermiso('/usuario', 'crear');
    this.permiteEditar = this.tienePermiso('/usuario', 'editar');
    this.permiteEliminar = this.tienePermiso('/usuario', 'eliminar');
  }

  private actualizarEstadoFormulario(): void {
    if (!this.permiteCrear && !this.permiteEditar) {
      this.usuarioForm.disable({ emitEvent: false });
    } else {
      this.usuarioForm.enable({ emitEvent: false });
    }
  }

  obtenerNombreRol(rolId: number | null | undefined): string {
    if (rolId == null) {
      return '—';
    }
    return this.roles.find(rol => rol.id === rolId)?.nombre ?? `Rol ${rolId}`;
  }

  private cargarRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        this.roles = (roles ?? []).map(rol => ({
          id: rol.id ?? 0,
          nombre: rol.nombre ?? `Rol ${rol.id}`
        }));
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.roles = [];
      }
    });
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
