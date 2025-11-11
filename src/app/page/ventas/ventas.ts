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

import { ApiService, Producto, VentaDetalle, VentaPedido } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class Ventas implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  ventaForm: FormGroup;
  busquedaControl = this.fb.control('', { nonNullable: true });

  ventas: VentaPedido[] = [];
  ventasFiltradas: VentaPedido[] = [];
  productos: Producto[] = [];

  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  modoEdicion = false;
  ventaEditandoId: number | null = null;
  pedidoExpandidoId: number | null = null;

  permiteCrear = false;
  permiteEditar = false;
  permiteEliminar = false;

  monedasDisponibles = ['COP', 'USD', 'EUR'];

  private sessionSub?: Subscription;
  private busquedaSub?: Subscription;
  private monedaSub?: Subscription;

  constructor() {
    this.ventaForm = this.fb.group({
      tipo_pedido: ['Nacional', [Validators.required, Validators.maxLength(50)]],
      id_cliente: [null, [Validators.required]],
      id_vendedor: [null, [Validators.required]],
      moneda: ['COP', [Validators.required, Validators.maxLength(10)]],
      trm: [1, [Validators.required, Validators.min(0)]],
      oc_cliente: [''],
      condicion_pago: [''],
      detalles: this.fb.array([])
    });
    this.agregarDetalle();
  }

  ngOnInit(): void {
    this.establecerPermisos();
    this.sessionSub = this.authService.session$.subscribe(() => {
      this.establecerPermisos();
      this.actualizarEstadoFormulario();
    });

    this.actualizarEstadoFormulario();
    this.cargarProductos();
    this.cargarVentas();

    this.busquedaSub = this.busquedaControl.valueChanges.subscribe(() => {
      this.filtrarVentas();
    });

    this.monedaSub = this.monedaControl?.valueChanges?.subscribe(moneda => {
      if ((moneda || '').toUpperCase() === 'COP') {
        this.trmControl?.setValue(1, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
    this.busquedaSub?.unsubscribe();
    this.monedaSub?.unsubscribe();
  }

  get detalles(): FormArray<FormGroup> {
    return this.ventaForm.get('detalles') as FormArray<FormGroup>;
  }

  get monedaControl() {
    return this.ventaForm.get('moneda');
  }

  get trmControl() {
    return this.ventaForm.get('trm');
  }

  get tipoPedidoControl() {
    return this.ventaForm.get('tipo_pedido');
  }

  get clienteControl() {
    return this.ventaForm.get('id_cliente');
  }

  get vendedorControl() {
    return this.ventaForm.get('id_vendedor');
  }

  get ocClienteControl() {
    return this.ventaForm.get('oc_cliente');
  }

  get condicionPagoControl() {
    return this.ventaForm.get('condicion_pago');
  }

  get totalFormulario(): number {
    return this.detalles.controls.reduce((acum, grupo) => {
      const cantidad = Number(grupo.get('cantidad_solicitada')?.value ?? 0);
      const precio = Number(grupo.get('precio_unitario')?.value ?? 0);
      return acum + cantidad * precio;
    }, 0);
  }

  cargarProductos(): void {
    this.apiService.getProductos().subscribe({
      next: productos => {
        this.productos = productos ?? [];
      },
      error: error => {
        console.error('Error al cargar productos:', error);
        this.productos = [];
      }
    });
  }

  cargarVentas(): void {
    this.cargando = true;
    this.mensajeError = null;
    this.apiService
      .getVentas()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: ventas => {
          this.ventas = ventas ?? [];
          this.filtrarVentas();
        },
        error: error => {
          console.error('Error al cargar ventas:', error);
          this.mensajeError = 'No se pudieron cargar las ventas. Intenta nuevamente.';
          this.ventas = [];
          this.ventasFiltradas = [];
        }
      });
  }

  filtrarVentas(): void {
    const termino = (this.busquedaControl.value ?? '').toLowerCase();
    if (!termino) {
      this.ventasFiltradas = [...this.ventas];
      return;
    }
    this.ventasFiltradas = this.ventas.filter(venta => {
      return (
        venta.id?.toString().includes(termino) ||
        venta.tipo_pedido?.toLowerCase().includes(termino) ||
        venta.moneda?.toLowerCase().includes(termino) ||
        venta.detalles?.some(det => det.producto_nombre?.toLowerCase().includes(termino))
      );
    });
  }

  agregarDetalle(detalle?: VentaDetalle): void {
    const grupo = this.crearDetalleFormGroup(detalle);
    this.detalles.push(grupo);
  }

  eliminarDetalle(indice: number): void {
    if (this.detalles.length === 1) {
      this.detalles.reset();
      return;
    }
    this.detalles.removeAt(indice);
  }

  calcularTotalDetalle(detalle: VentaDetalle): number {
    return Number(detalle.cantidad_solicitada ?? 0) * Number(detalle.precio_unitario ?? 0);
  }

  calcularTotalPedido(venta: VentaPedido): number {
    return (venta.detalles ?? []).reduce((acum, det) => acum + (det.precio_total ? Number(det.precio_total) : this.calcularTotalDetalle(det)), 0);
  }

  toggleExpancion(id?: number): void {
    this.pedidoExpandidoId = this.pedidoExpandidoId === id ? null : id ?? null;
  }

  guardarVenta(): void {
    if (this.ventaForm.invalid || !this.detalles.length) {
      this.ventaForm.markAllAsTouched();
      this.detalles.controls.forEach(control => control.markAllAsTouched());
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

    if (this.modoEdicion && this.ventaEditandoId !== null) {
      this.apiService
        .actualizarVenta(this.ventaEditandoId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: ventaActualizada => {
            this.mensajeExito = 'Pedido actualizado correctamente.';
            this.cancelarEdicion();
            this.reemplazarVentaEnLista(ventaActualizada);
          },
          error: error => {
            console.error('Error al actualizar venta:', error);
            this.mensajeError = error?.error?.detail ?? 'No se pudo actualizar la venta.';
          }
        });
    } else {
      this.apiService
        .crearVenta(payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: nuevaVenta => {
            this.mensajeExito = 'Pedido creado correctamente.';
            this.limpiarFormulario();
            this.agregarVentaALista(nuevaVenta);
          },
          error: error => {
            console.error('Error al crear venta:', error);
            this.mensajeError = error?.error?.detail ?? 'No se pudo crear la venta.';
          }
        });
    }
  }

  editarVenta(venta: VentaPedido): void {
    if (!this.permiteEditar) {
      return;
    }

    this.modoEdicion = true;
    this.ventaEditandoId = venta.id ?? null;
    this.mensajeError = null;
    this.mensajeExito = null;

    this.ventaForm.patchValue({
      tipo_pedido: venta.tipo_pedido,
      id_cliente: venta.id_cliente,
      id_vendedor: venta.id_vendedor,
      moneda: venta.moneda,
      trm: venta.trm ?? 1,
      oc_cliente: venta.oc_cliente ?? '',
      condicion_pago: venta.condicion_pago ?? ''
    });

    this.detalles.clear();
    (venta.detalles ?? []).forEach(det => this.agregarDetalle(det));
    if (this.detalles.length === 0) {
      this.agregarDetalle();
    }
    this.actualizarEstadoFormulario();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.ventaEditandoId = null;
    this.limpiarFormulario();
    this.actualizarEstadoFormulario();
  }

  limpiarFormulario(): void {
    this.ventaForm.reset({
      tipo_pedido: 'Nacional',
      id_cliente: null,
      id_vendedor: null,
      moneda: 'COP',
      trm: 1,
      oc_cliente: '',
      condicion_pago: ''
    });
    this.detalles.clear();
    this.agregarDetalle();
    this.ventaForm.markAsPristine();
    this.ventaForm.markAsUntouched();
  }

  anularVenta(venta: VentaPedido): void {
    if (!this.permiteEliminar || venta.id == null) {
      return;
    }
    const confirmado = window.confirm('¿Deseas eliminar este pedido?');
    if (!confirmado) {
      return;
    }
    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.apiService
      .eliminarVenta(venta.id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: respuesta => {
          this.mensajeExito = respuesta?.mensaje ?? 'Pedido eliminado correctamente.';
          this.ventas = this.ventas.filter(item => item.id !== venta.id);
          this.filtrarVentas();
        },
        error: error => {
          console.error('Error al eliminar venta:', error);
          this.mensajeError = error?.error?.detail ?? 'No se pudo eliminar la venta.';
        }
      });
  }

  private crearDetalleFormGroup(detalle?: VentaDetalle): FormGroup {
    const grupo = this.fb.group({
      id_producto: [detalle?.id_producto ?? null, [Validators.required]],
      cantidad_solicitada: [detalle?.cantidad_solicitada ?? 1, [Validators.required, Validators.min(0.01)]],
      cantidad_confirmada: [detalle?.cantidad_confirmada ?? detalle?.cantidad_solicitada ?? null, [Validators.min(0)]],
      precio_unitario: [detalle?.precio_unitario ?? 0, [Validators.required, Validators.min(0)]],
      numero_documento: [detalle?.numero_documento ?? ''],
      tipo_documento: [detalle?.tipo_documento ?? ''],
      estado_siguiente: [detalle?.estado_siguiente ?? 1, [Validators.required]],
      estado_anterior: [detalle?.estado_anterior ?? 1, [Validators.required]]
    });

    grupo.get('id_producto')?.valueChanges.subscribe(valor => {
      const producto = this.productos.find(p => p.id === Number(valor));
      if (producto && producto.precio != null) {
        grupo.get('precio_unitario')?.setValue(producto.precio, { emitEvent: false });
      }
    });

    return grupo;
  }

  private construirPayload(): VentaPedido {
    const detalles = this.detalles.controls.map((grupo, indice) => {
      const cantidad = Number(grupo.get('cantidad_solicitada')?.value ?? 0);
      const cantidadConfirmada = grupo.get('cantidad_confirmada')?.value;
      const precio = Number(grupo.get('precio_unitario')?.value ?? 0);
      const estadoSiguiente = Number(grupo.get('estado_siguiente')?.value ?? 1);
      const estadoAnterior = Number(grupo.get('estado_anterior')?.value ?? 1);
      return {
        id_producto: Number(grupo.get('id_producto')?.value),
        numero_linea: indice + 1,
        cantidad_solicitada: cantidad,
        cantidad_confirmada: cantidadConfirmada != null ? Number(cantidadConfirmada) : undefined,
        precio_unitario: precio,
        numero_documento: grupo.get('numero_documento')?.value || undefined,
        tipo_documento: grupo.get('tipo_documento')?.value || undefined,
        estado_siguiente: estadoSiguiente,
        estado_anterior: estadoAnterior
      } as VentaDetalle;
    });

    return {
      tipo_pedido: this.tipoPedidoControl?.value,
      id_cliente: Number(this.clienteControl?.value),
      id_vendedor: Number(this.vendedorControl?.value),
      moneda: (this.monedaControl?.value || 'COP').toUpperCase(),
      trm: Number(this.trmControl?.value ?? 1),
      oc_cliente: this.ocClienteControl?.value || undefined,
      condicion_pago: this.condicionPagoControl?.value || undefined,
      detalles
    } as VentaPedido;
  }

  private reemplazarVentaEnLista(ventaActualizada: VentaPedido): void {
    const indice = this.ventas.findIndex(venta => venta.id === ventaActualizada.id);
    if (indice >= 0) {
      this.ventas[indice] = ventaActualizada;
    } else {
      this.ventas.unshift(ventaActualizada);
    }
    this.filtrarVentas();
  }

  private agregarVentaALista(ventaNueva: VentaPedido): void {
    this.ventas.unshift(ventaNueva);
    this.filtrarVentas();
  }

  private establecerPermisos(): void {
    this.permiteCrear = this.tienePermiso('/ventas', 'crear');
    this.permiteEditar = this.tienePermiso('/ventas', 'editar');
    this.permiteEliminar = this.tienePermiso('/ventas', 'eliminar');
  }

  private actualizarEstadoFormulario(): void {
    const puedeEditar = this.permiteCrear || (this.modoEdicion && this.permiteEditar);
    if (!puedeEditar) {
      this.ventaForm.disable({ emitEvent: false });
    } else {
      this.ventaForm.enable({ emitEvent: false });
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
