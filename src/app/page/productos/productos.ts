import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ApiService, DimensionProducto, Producto } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  productoForm: FormGroup;
  busquedaControl = this.fb.control('', { nonNullable: true });

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  productoEditandoId: number | null = null;
  productoExpandidoId: number | null = null;

  permiteCrear = false;
  permiteEditar = false;
  permiteEliminar = false;

  categoriasDisponibles = ['Barra', 'Lámina', 'Tubo', 'Perfil', 'General'];
  unidadesDisponibles = ['m', 'cm', 'mm', 'kg', 'unidad'];
  estadosDisponibles = ['Activo', 'Inactivo'];

  private sessionSub?: Subscription;
  private busquedaSub?: Subscription;

  constructor() {
    this.productoForm = this.fb.group({
      codigo_producto: ['', [Validators.required, Validators.maxLength(50)]],
      nombre_producto: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: [''],
      categoria: [''],
      unidad_medida: [''],
      estado: ['Activo', [Validators.required]],
      dimensiones: this.fb.array([])
    });
    this.agregarDimension();
  }

  ngOnInit(): void {
    this.establecerPermisos();
    this.sessionSub = this.authService.session$.subscribe(() => {
      this.establecerPermisos();
      this.actualizarEstadoFormulario();
    });

    this.actualizarEstadoFormulario();
    this.cargarProductos();

    this.busquedaSub = this.busquedaControl.valueChanges.subscribe(() => {
      this.filtrarProductos();
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
    this.busquedaSub?.unsubscribe();
  }

  get dimensiones(): FormArray<FormGroup> {
    return this.productoForm.get('dimensiones') as FormArray<FormGroup>;
  }

  get codigoControl() {
    return this.productoForm.get('codigo_producto');
  }

  get nombreControl() {
    return this.productoForm.get('nombre_producto');
  }

  get estadoControl() {
    return this.productoForm.get('estado');
  }

  agregarDimension(dimension?: DimensionProducto): void {
    const grupo = this.fb.group({
      ancho: [dimension?.ancho ?? 0, [Validators.required, Validators.min(0)]],
      espesor: [dimension?.espesor ?? 0, [Validators.required, Validators.min(0)]],
      diametro_interno: [dimension?.diametro_interno ?? 0, [Validators.required, Validators.min(0)]],
      diametro_externo: [dimension?.diametro_externo ?? 0, [Validators.required, Validators.min(0)]],
    });
    this.dimensiones.push(grupo);
  }

  eliminarDimension(indice: number): void {
    if (this.dimensiones.length === 1) {
      this.dimensiones.at(0).reset({ ancho: 0, espesor: 0, diametro_interno: 0, diametro_externo: 0 });
      return;
    }
    this.dimensiones.removeAt(indice);
  }

  cargarProductos(): void {
    this.cargando = true;
    this.mensajeError = null;
    this.apiService
      .getProductos()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: productos => {
          this.productos = productos ?? [];
          this.filtrarProductos();
        },
        error: error => {
          console.error('Error al cargar productos:', error);
          this.mensajeError = 'No se pudieron cargar los productos. Intenta nuevamente.';
          this.productos = [];
          this.productosFiltrados = [];
        }
      });
  }

  filtrarProductos(): void {
    const termino = (this.busquedaControl.value ?? '').toLowerCase();
    if (!termino) {
      this.productosFiltrados = [...this.productos];
      return;
    }
    this.productosFiltrados = this.productos.filter(producto => {
      return (
        producto.codigo_producto?.toLowerCase().includes(termino) ||
        producto.nombre_producto?.toLowerCase().includes(termino) ||
        producto.categoria?.toLowerCase().includes(termino)
      );
    });
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.dimensiones.controls.forEach(control => control.markAllAsTouched());
      return;
    }

    if (!this.modoEdicion && !this.permiteCrear) {
      return;
    }

    if (this.modoEdicion && !this.permiteEditar) {
      return;
    }

    const payload = this.construirPayload();

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.modoEdicion && this.productoEditandoId !== null) {
      this.apiService
        .actualizarProducto(this.productoEditandoId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: productoActualizado => {
            this.mensajeExito = 'Producto actualizado correctamente.';
            this.replaceProducto(productoActualizado);
            this.cancelarEdicion();
          },
          error: error => {
            console.error('Error al actualizar producto:', error);
            this.mensajeError = error?.error?.detail ?? 'No se pudo actualizar el producto.';
          }
        });
    } else {
      this.apiService
        .crearProducto(payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: productoNuevo => {
            this.mensajeExito = 'Producto creado correctamente.';
            this.productos.unshift(productoNuevo);
            this.filtrarProductos();
            this.limpiarFormulario();
          },
          error: error => {
            console.error('Error al crear producto:', error);
            this.mensajeError = error?.error?.detail ?? 'No se pudo crear el producto.';
          }
        });
    }
  }

  editarProducto(producto: Producto): void {
    if (!this.permiteEditar) {
      return;
    }
    this.modoEdicion = true;
    this.productoEditandoId = producto.id ?? null;
    this.productoForm.patchValue({
      codigo_producto: producto.codigo_producto,
      nombre_producto: producto.nombre_producto,
      descripcion: producto.descripcion ?? '',
      categoria: producto.categoria ?? '',
      unidad_medida: producto.unidad_medida ?? '',
      estado: producto.estado ?? 'Activo'
    });
    this.dimensiones.clear();
    (producto.dimensiones ?? []).forEach(dimension => this.agregarDimension(dimension));
    if (this.dimensiones.length === 0) {
      this.agregarDimension();
    }
    this.actualizarEstadoFormulario();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.productoEditandoId = null;
    this.limpiarFormulario();
    this.actualizarEstadoFormulario();
  }

  limpiarFormulario(): void {
    this.productoForm.reset({
      codigo_producto: '',
      nombre_producto: '',
      descripcion: '',
      categoria: '',
      unidad_medida: '',
      estado: 'Activo'
    });
    this.dimensiones.clear();
    this.agregarDimension();
    this.productoForm.markAsPristine();
    this.productoForm.markAsUntouched();
  }

  eliminarProducto(producto: Producto): void {
    if (!this.permiteEliminar || producto.id == null) {
      return;
    }
    const confirmado = window.confirm(`¿Deseas eliminar el producto "${producto.nombre_producto}"?`);
    if (!confirmado) {
      return;
    }
    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.apiService
      .eliminarProducto(producto.id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: respuesta => {
          this.mensajeExito = respuesta?.mensaje ?? 'Producto eliminado correctamente.';
          this.productos = this.productos.filter(item => item.id !== producto.id);
          this.filtrarProductos();
        },
        error: error => {
          console.error('Error al eliminar producto:', error);
          this.mensajeError = error?.error?.detail ?? 'No se pudo eliminar el producto.';
        }
      });
  }

  toggleExpansion(productoId?: number): void {
    this.productoExpandidoId = this.productoExpandidoId === productoId ? null : productoId ?? null;
  }

  generarCodigo(): void {
    const prefijo = (this.productoForm.get('categoria')?.value || 'PRD').toString().slice(0, 3).toUpperCase();
    const aleatorio = Math.floor(Math.random() * 9000 + 1000);
    this.codigoControl?.setValue(`${prefijo}-${aleatorio}`);
  }

  private construirPayload(): Producto {
    const dimensiones = this.dimensiones.controls.map(grupo => ({
      ancho: Number(grupo.get('ancho')?.value ?? 0),
      espesor: Number(grupo.get('espesor')?.value ?? 0),
      diametro_interno: Number(grupo.get('diametro_interno')?.value ?? 0),
      diametro_externo: Number(grupo.get('diametro_externo')?.value ?? 0),
    }));

    return {
      codigo_producto: this.codigoControl?.value,
      nombre_producto: this.nombreControl?.value,
      descripcion: this.productoForm.get('descripcion')?.value || undefined,
      categoria: this.productoForm.get('categoria')?.value || undefined,
      unidad_medida: this.productoForm.get('unidad_medida')?.value || undefined,
      estado: this.estadoControl?.value || 'Activo',
      dimensiones
    };
  }

  private replaceProducto(producto: Producto): void {
    const indice = this.productos.findIndex(item => item.id === producto.id);
    if (indice >= 0) {
      this.productos[indice] = producto;
    } else {
      this.productos.unshift(producto);
    }
    this.filtrarProductos();
  }

  private establecerPermisos(): void {
    this.permiteCrear = this.tienePermiso('/productos', 'crear');
    this.permiteEditar = this.tienePermiso('/productos', 'editar');
    this.permiteEliminar = this.tienePermiso('/productos', 'eliminar');
  }

  private actualizarEstadoFormulario(): void {
    const editable = this.permiteCrear || (this.modoEdicion && this.permiteEditar);
    if (!editable) {
      this.productoForm.disable({ emitEvent: false });
    } else {
      this.productoForm.enable({ emitEvent: false });
    }
  }

  private tienePermiso(ruta: string, permiso: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean {
    const servicio = this.authService as any;
    if (typeof servicio?.hasPermission === 'function') {
      return servicio.hasPermission(ruta, permiso);
    }
    const permisos = new Set<string>(
      servicio?.getPermisosDeRuta?.(ruta)?.map((p: string) => (p ? p.toLowerCase() : p)) ?? []
    );
    return permiso === 'ver' ? permisos.has('ver') || permisos.size > 0 : permisos.has(permiso);
  }
}
