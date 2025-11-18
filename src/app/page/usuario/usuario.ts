import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, Usuario } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UbicacionesService, Departamento, Ciudad } from '../../services/ubicaciones.service';

interface RolOption {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class UsuarioPage implements OnInit, OnDestroy {
  usuarioForm: FormGroup;
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

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

  // Búsqueda y filtros
  busquedaTexto = '';
  filtroRol = '';
  filtroEstado = '';
  ordenColumna: string | null = null;
  ordenDireccion: 'asc' | 'desc' = 'asc';

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 10;

  estados = [
    { valor: 'Activo', texto: 'Activo' },
    { valor: 'Inactivo', texto: 'Inactivo' }
  ];

  // Propiedades para ubicaciones
  departamentos: Departamento[] = [];
  ciudades: Ciudad[] = [];
  todasLasCiudades: Ciudad[] = []; // Para buscar ciudades por ID en la lista
  departamentoSeleccionado: number | null = null;
  cargandoUbicaciones = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private ubicacionesService: UbicacionesService
  ) {
    this.usuarioForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.maxLength(120)]],
      apellidos: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefono: ['', [Validators.required, Validators.maxLength(30)]],
      cedula: ['', [Validators.required, Validators.maxLength(20)]],
      contrasena: ['', [Validators.minLength(6), Validators.maxLength(255)]],
      rol_id: ['', [Validators.required]],
      estado: ['Activo', [Validators.required]],
      departamento_id: [null],
      ciudad_id: [null]
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
    this.cargarDepartamentos();
    this.cargarTodasLasCiudades(); // Cargar todas las ciudades para mostrar en la lista
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
          this.aplicarFiltros();
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

    const contrasenaValor = (this.contrasena?.value ?? '').trim();

    if (!this.modoEdicion && contrasenaValor.length === 0) {
      this.contrasena?.setErrors({ required: true });
      this.contrasena?.markAsTouched();
      return;
    }

    const payload: Usuario = {
      nombres: this.nombres?.value.trim(),
      apellidos: this.apellidos?.value.trim(),
      email: this.email?.value.trim(),
      telefono: this.telefono?.value.trim(),
      cedula: this.cedula?.value.trim(),
      rol_id: Number(this.rol_id?.value),
      estado: this.estado?.value
    };

    // Agregar departamento_id y ciudad_id si están seleccionados
    const departamentoId = this.usuarioForm.get('departamento_id')?.value;
    const ciudadId = this.usuarioForm.get('ciudad_id')?.value;
    
    if (departamentoId) {
      payload.departamento_id = Number(departamentoId);
    }
    
    if (ciudadId) {
      payload.ciudad_id = Number(ciudadId);
    }

    if (contrasenaValor.length > 0) {
      payload.contrasena = contrasenaValor;
    }

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
      contrasena: '',
      rol_id: usuario.rol_id ?? '',
      estado: usuario.estado ?? 'Activo',
      departamento_id: usuario.departamento_id ?? null,
      ciudad_id: usuario.ciudad_id ?? null
    });

    // Si el usuario tiene departamento, cargar sus ciudades
    if (usuario.departamento_id) {
      this.departamentoSeleccionado = usuario.departamento_id;
      this.ubicacionesService
        .getCiudadesActivasPorDepartamento(usuario.departamento_id)
        .subscribe({
          next: (ciudades: Ciudad[]) => {
            this.ciudades = ciudades;
          },
          error: (error: any) => {
            console.error('Error al cargar ciudades:', error);
            this.ciudades = [];
          }
        });
    } else {
      this.departamentoSeleccionado = null;
      this.ciudades = [];
    }

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
    this.departamentoSeleccionado = null;
    this.ciudades = [];
    this.usuarioForm.reset({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      cedula: '',
      contrasena: '',
      rol_id: '',
      estado: 'Activo',
      departamento_id: null,
      ciudad_id: null
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

  obtenerNombreDepartamento(departamentoId: number | null | undefined): string {
    if (departamentoId == null || departamentoId === 0) {
      return '—';
    }
    // Buscar en el array de departamentos
    const departamento = this.departamentos.find(dept => dept.id === departamentoId);
    if (departamento?.nombre) {
      return departamento.nombre;
    }
    // Si no se encuentra, intentar cargar de nuevo (por si acaso)
    if (this.departamentos.length === 0) {
      this.cargarDepartamentos();
    }
    return `Dept. ${departamentoId}`;
  }

  obtenerNombreCiudad(ciudadId: number | null | undefined): string {
    if (ciudadId == null || ciudadId === 0) {
      return '—';
    }
    // Buscar en el array de todas las ciudades
    const ciudad = this.todasLasCiudades.find(c => c.id === ciudadId);
    if (ciudad?.nombre) {
      return ciudad.nombre;
    }
    // Si no se encuentra, intentar cargar de nuevo (por si acaso)
    if (this.todasLasCiudades.length === 0) {
      this.cargarTodasLasCiudades();
    }
    return `Ciudad ${ciudadId}`;
  }

  cargarTodasLasCiudades(): void {
    // Cargar todas las ciudades para poder buscar por ID en la lista
    this.ubicacionesService.getCiudades().subscribe({
      next: (ciudades: Ciudad[]) => {
        this.todasLasCiudades = ciudades || [];
        console.log('✅ Ciudades cargadas para lista:', this.todasLasCiudades.length);
        if (this.todasLasCiudades.length > 0) {
          console.log('Ejemplo de ciudad:', this.todasLasCiudades[0]);
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar todas las ciudades:', error);
        this.todasLasCiudades = [];
      }
    });
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

  cargarDepartamentos(): void {
    this.cargandoUbicaciones = true;
    console.log('🔄 Cargando departamentos...');
    this.ubicacionesService.getDepartamentosActivos().subscribe({
      next: (departamentos: Departamento[]) => {
        this.departamentos = departamentos || [];
        this.cargandoUbicaciones = false;
        console.log('✅ Departamentos cargados exitosamente:', this.departamentos.length);
        if (this.departamentos.length > 0) {
          console.log('Ejemplo de departamento:', this.departamentos[0]);
        }
      },
      error: (error: any) => {
        console.error('Error al cargar departamentos:', error);
        console.error('URL intentada:', this.ubicacionesService.getBaseUrl() + '/api/departamentos/getDepartamentos');
        console.error('Detalles del error:', error?.error || error?.message || error);
        this.departamentos = [];
        this.cargandoUbicaciones = false;
        // No mostrar error al usuario, los campos son opcionales
      }
    });
  }

  onDepartamentoChange(departamentoId: number | null): void {
    this.departamentoSeleccionado = departamentoId;
    this.ciudades = [];
    this.usuarioForm.patchValue({ ciudad_id: null });

    if (departamentoId) {
      this.cargandoUbicaciones = true;
      this.ubicacionesService
        .getCiudadesActivasPorDepartamento(departamentoId)
        .subscribe({
          next: (ciudades: Ciudad[]) => {
            this.ciudades = ciudades;
            this.cargandoUbicaciones = false;
          },
          error: (error: any) => {
            console.error('Error al cargar ciudades:', error);
            this.ciudades = [];
            this.cargandoUbicaciones = false;
          }
        });
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

  // ============================================
  // BÚSQUEDA Y FILTRADO
  // ============================================

  aplicarFiltros() {
    let filtrados = [...this.usuarios];

    // Filtro por texto de búsqueda
    if (this.busquedaTexto.trim()) {
      const termino = this.busquedaTexto.toLowerCase().trim();
      filtrados = filtrados.filter(u => 
        (u.nombres?.toLowerCase() || '').includes(termino) ||
        (u.apellidos?.toLowerCase() || '').includes(termino) ||
        (u.email?.toLowerCase() || '').includes(termino) ||
        (u.cedula?.toLowerCase() || '').includes(termino) ||
        (u.telefono?.toLowerCase() || '').includes(termino)
      );
    }

    // Filtro por rol
    if (this.filtroRol) {
      filtrados = filtrados.filter(u => u.rol_id?.toString() === this.filtroRol);
    }

    // Filtro por estado
    if (this.filtroEstado) {
      filtrados = filtrados.filter(u => u.estado === this.filtroEstado);
    }

    // Ordenamiento
    if (this.ordenColumna) {
      filtrados.sort((a, b) => {
        let valorA: any;
        let valorB: any;

        switch (this.ordenColumna) {
          case 'id':
            valorA = a.id || 0;
            valorB = b.id || 0;
            break;
          case 'nombres':
            valorA = ((a.nombres || '') + ' ' + (a.apellidos || '')).toLowerCase();
            valorB = ((b.nombres || '') + ' ' + (b.apellidos || '')).toLowerCase();
            break;
          case 'email':
            valorA = (a.email || '').toLowerCase();
            valorB = (b.email || '').toLowerCase();
            break;
          case 'rol':
            const nombreRolA = this.roles.find(r => r.id === a.rol_id)?.nombre || '';
            const nombreRolB = this.roles.find(r => r.id === b.rol_id)?.nombre || '';
            valorA = nombreRolA.toLowerCase();
            valorB = nombreRolB.toLowerCase();
            break;
          case 'estado':
            valorA = (a.estado || '').toLowerCase();
            valorB = (b.estado || '').toLowerCase();
            break;
          case 'created_at':
            valorA = a.created_at ? new Date(a.created_at).getTime() : 0;
            valorB = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (typeof valorA === 'string') {
          return this.ordenDireccion === 'asc' 
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
        } else {
          return this.ordenDireccion === 'asc' 
            ? valorA - valorB
            : valorB - valorA;
        }
      });
    }

    this.usuariosFiltrados = filtrados;
    this.paginaActual = 1;
  }

  limpiarFiltros() {
    this.busquedaTexto = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.ordenColumna = null;
    this.ordenDireccion = 'asc';
    this.aplicarFiltros();
  }

  ordenarPor(columna: string) {
    if (this.ordenColumna === columna) {
      this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenColumna = columna;
      this.ordenDireccion = 'asc';
    }
    this.aplicarFiltros();
  }

  // ============================================
  // PAGINACIÓN
  // ============================================

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.registrosPorPagina));
  }

  get usuariosPaginados(): Usuario[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(direccion: 'prev' | 'next' | number) {
    if (typeof direccion === 'number') {
      this.paginaActual = direccion;
    } else if (direccion === 'prev' && this.paginaActual > 1) {
      this.paginaActual--;
    } else if (direccion === 'next' && this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  // ============================================
  // EXPORTACIÓN
  // ============================================

  exportarCSV() {
    if (this.usuariosFiltrados.length === 0) {
      this.mensajeError = 'No hay usuarios para exportar';
      return;
    }

    const headers = ['ID', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'Cédula', 'Rol', 'Estado', 'Fecha Creación'];
    const filas = this.usuariosFiltrados.map(u => [
      u.id?.toString() || '',
      u.nombres || '',
      u.apellidos || '',
      u.email || '',
      u.telefono || '',
      u.cedula || '',
      this.roles.find(r => r.id === u.rol_id)?.nombre || '',
      u.estado || '',
      u.created_at ? new Date(u.created_at).toLocaleString() : ''
    ]);

    const csv = [
      headers.join(','),
      ...filas.map(fila => fila.map(campo => `"${campo.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.mensajeExito = 'Usuarios exportados exitosamente';
  }
}
