import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, Usuario } from '../../services/api.service';

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
export class UsuarioPage implements OnInit {
  usuarioForm: FormGroup;
  usuarios: Usuario[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  usuarioSeleccionadoId: number | null = null;

  roles: RolOption[] = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Operador' },
    { id: 3, nombre: 'Auditor' }
  ];

  estados = [
    { valor: 'Activo', texto: 'Activo' },
    { valor: 'Inactivo', texto: 'Inactivo' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
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
    this.cargarUsuarios();
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
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

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
  }

  obtenerNombreRol(rolId: number | null | undefined): string {
    if (rolId == null) {
      return '—';
    }
    return this.roles.find(rol => rol.id === rolId)?.nombre ?? `Rol ${rolId}`;
  }
}
