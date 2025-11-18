import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, Producto } from '../../services/api.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {
  // Formulario de nuevo producto
  nuevoProducto: Producto = {
    codigo_producto: '',
    nombre_producto: '',
    descripcion: '',
    categoria: '',
    unidad_medida: '',
    estado: 'Activo'
  };

  // Producto en edición
  productoEditando: Producto | null = null;
  editando = false;

  // Lista de productos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  productosCargando = false;

  // Búsqueda y filtros
  busquedaTexto = '';
  filtroCategoria = '';
  filtroEstado = '';
  ordenColumna: string | null = null;
  ordenDireccion: 'asc' | 'desc' = 'asc';

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 10;

  // Estados y categorías según BD
  estados = [
    { valor: 'Activo', texto: 'Activo' },
    { valor: 'Inactivo', texto: 'Inactivo' },
    { valor: 'Suspendido', texto: 'Suspendido' },
    { valor: 'Sin info', texto: 'Sin info' }
  ];

  // Categorías basadas en datos reales de BD
  categorias = [
    { valor: '', texto: 'Seleccionar categoría' },
    { valor: 'Barra Redonda', texto: 'Barra Redonda' },
    { valor: 'Barra Hexagonal', texto: 'Barra Hexagonal' },
    { valor: 'Barra Cuadrada', texto: 'Barra Cuadrada' },
    { valor: 'Tubería', texto: 'Tubería' },
    { valor: 'Tubería Rectangular', texto: 'Tubería Rectangular' },
    { valor: 'Tubería Cuadrada', texto: 'Tubería Cuadrada' },
    { valor: 'Lámina', texto: 'Lámina' },
    { valor: 'Lámina Inoxidable', texto: 'Lámina Inoxidable' },
    { valor: 'Lámina Galvanizada', texto: 'Lámina Galvanizada' },
    { valor: 'Perfil Angular', texto: 'Perfil Angular' },
    { valor: 'Viga I', texto: 'Viga I' },
    { valor: 'Viga H', texto: 'Viga H' },
    { valor: 'Canal U', texto: 'Canal U' },
    { valor: 'Perfil T', texto: 'Perfil T' }
  ];

  // Unidades de medida según BD
  unidadesMedida = [
    { valor: '', texto: 'Seleccionar unidad' },
    { valor: 'm', texto: 'Metros (m)' },
    { valor: 'm²', texto: 'Metros cuadrados (m²)' },
    { valor: 'kg', texto: 'Kilogramos (kg)' },
    { valor: 'un', texto: 'Unidad (un)' }
  ];

  // Mensajes de feedback
  mensajeExito = '';
  mensajeError = '';
  mostrandoMensaje = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarProductos();
  }

  // Cargar lista de productos
  cargarProductos() {
    this.productosCargando = true;
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos recibidos:', productos);
        // Manejar diferentes formatos de respuesta del backend
        if (Array.isArray(productos)) {
          this.productos = productos;
        } else if (productos && typeof productos === 'object' && 'resultado' in productos) {
          this.productos = (productos as any).resultado || [];
        } else if (productos && typeof productos === 'object' && 'data' in productos) {
          this.productos = (productos as any).data || [];
        } else {
          this.productos = [];
        }
        console.log('Productos procesados:', this.productos);
        this.aplicarFiltros();
        this.productosCargando = false;
      },
      error: (error) => {
        console.error('Error completo al cargar productos:', error);
        console.error('Error status:', error?.status);
        console.error('Error message:', error?.message);
        console.error('Error body:', error?.error);
        const mensaje = error?.error?.detail || error?.error?.mensaje || error?.message || 'Error al cargar los productos. Por favor, intenta nuevamente.';
        this.mostrarError(mensaje);
        this.productosCargando = false;
      }
    });
  }

  // Crear nuevo producto
  crearProducto() {
    if (!this.validarFormulario()) {
      return;
    }

    // Limpiar campos vacíos antes de enviar
    const productoPayload: any = {
      codigo_producto: this.nuevoProducto.codigo_producto.trim(),
      nombre_producto: this.nuevoProducto.nombre_producto.trim()
    };

    // Solo agregar campos opcionales si tienen valor
    if (this.nuevoProducto.descripcion?.trim()) {
      productoPayload.descripcion = this.nuevoProducto.descripcion.trim();
    }
    if (this.nuevoProducto.categoria?.trim()) {
      productoPayload.categoria = this.nuevoProducto.categoria.trim();
    }
    if (this.nuevoProducto.unidad_medida?.trim()) {
      productoPayload.unidad_medida = this.nuevoProducto.unidad_medida.trim();
    }
    if (this.nuevoProducto.estado) {
      productoPayload.estado = this.nuevoProducto.estado;
    }

    console.log('Enviando producto:', productoPayload);

    this.apiService.crearProducto(productoPayload).subscribe({
      next: (producto) => {
        console.log('Producto creado exitosamente:', producto);
        this.mostrarExito('Producto creado exitosamente');
        this.limpiarFormulario();
        // Esperar un momento antes de recargar para asegurar que el backend procesó
        setTimeout(() => {
          this.cargarProductos();
        }, 500);
      },
      error: (error) => {
        console.error('Error completo al crear producto:', error);
        console.error('Error status:', error?.status);
        console.error('Error message:', error?.message);
        console.error('Error body:', error?.error);
        let mensaje = 'Error al crear el producto';
        if (error?.error) {
          if (error.error.detail) {
            mensaje = error.error.detail;
          } else if (error.error.mensaje) {
            mensaje = error.error.mensaje;
          } else if (typeof error.error === 'string') {
            mensaje = error.error;
          } else if (error.error.message) {
            mensaje = error.error.message;
          }
        } else if (error?.message) {
          mensaje = error.message;
        }
        this.mostrarError(mensaje);
      }
    });
  }

  // Editar producto
  editarProducto(producto: Producto) {
    this.productoEditando = { ...producto };
    this.nuevoProducto = {
      codigo_producto: producto.codigo_producto || '',
      nombre_producto: producto.nombre_producto || '',
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || '',
      estado: producto.estado || 'Activo'
    };
    this.editando = true;
    
    // Scroll al formulario
    const formSection = document.querySelector('.nuevo-producto-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Actualizar producto
  actualizarProducto() {
    if (!this.validarFormulario() || !this.productoEditando?.id) {
      return;
    }

    // Limpiar campos vacíos antes de enviar
    const productoPayload: any = {
      codigo_producto: this.nuevoProducto.codigo_producto.trim(),
      nombre_producto: this.nuevoProducto.nombre_producto.trim()
    };

    // Solo agregar campos opcionales si tienen valor
    if (this.nuevoProducto.descripcion?.trim()) {
      productoPayload.descripcion = this.nuevoProducto.descripcion.trim();
    }
    if (this.nuevoProducto.categoria?.trim()) {
      productoPayload.categoria = this.nuevoProducto.categoria.trim();
    }
    if (this.nuevoProducto.unidad_medida?.trim()) {
      productoPayload.unidad_medida = this.nuevoProducto.unidad_medida.trim();
    }
    if (this.nuevoProducto.estado) {
      productoPayload.estado = this.nuevoProducto.estado;
    }

    console.log('Actualizando producto ID:', this.productoEditando.id, 'con datos:', productoPayload);

    this.apiService.actualizarProducto(this.productoEditando.id, productoPayload).subscribe({
      next: (producto) => {
        console.log('Producto actualizado exitosamente:', producto);
        this.mostrarExito('Producto actualizado exitosamente');
        this.cancelarEdicion();
        setTimeout(() => {
          this.cargarProductos();
        }, 500);
      },
      error: (error) => {
        console.error('Error completo al actualizar producto:', error);
        console.error('Error status:', error?.status);
        console.error('Error body:', error?.error);
        let mensaje = 'Error al actualizar el producto';
        if (error?.error) {
          if (error.error.detail) {
            mensaje = error.error.detail;
          } else if (error.error.mensaje) {
            mensaje = error.error.mensaje;
          } else if (typeof error.error === 'string') {
            mensaje = error.error;
          }
        }
        this.mostrarError(mensaje);
      }
    });
  }

  // Eliminar producto (cambiar estado a Inactivo)
  eliminarProducto(producto: Producto) {
    if (!producto.id) {
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre_producto || producto.nombre}"?`)) {
      return;
    }

    const productoPayload: Producto = {
      ...producto,
      estado: 'Inactivo'
    };

    this.apiService.actualizarProducto(producto.id, productoPayload).subscribe({
      next: () => {
        this.mostrarExito('Producto eliminado exitosamente');
        this.cargarProductos();
      },
      error: (error) => {
        console.error('Error al eliminar producto:', error);
        const mensaje = error?.error?.detail || error?.error?.mensaje || 'Error al eliminar el producto';
        this.mostrarError(mensaje);
      }
    });
  }

  // Cancelar edición
  cancelarEdicion() {
    this.editando = false;
    this.productoEditando = null;
    this.limpiarFormulario();
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.nuevoProducto = {
      codigo_producto: '',
      nombre_producto: '',
      descripcion: '',
      categoria: '',
      unidad_medida: '',
      estado: 'Activo'
    };
    this.editando = false;
    this.productoEditando = null;
  }

  // Generar código automático basado en categoría
  generarCodigo() {
    if (!this.nuevoProducto.categoria) {
      this.mostrarError('Primero selecciona una categoría');
      return;
    }

    const categoria = this.nuevoProducto.categoria.substring(0, 3).toUpperCase();
    const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.nuevoProducto.codigo_producto = categoria + '-' + numero;
  }

  // Validar formulario
  validarFormulario(): boolean {
    if (!this.nuevoProducto.codigo_producto?.trim()) {
      this.mostrarError('El código del producto es requerido');
      return false;
    }

    if (!this.nuevoProducto.nombre_producto?.trim()) {
      this.mostrarError('El nombre del producto es requerido');
      return false;
    }

    return true;
  }

  // Mostrar mensaje de éxito
  mostrarExito(mensaje: string) {
    this.mensajeExito = mensaje;
    this.mensajeError = '';
    this.mostrandoMensaje = true;
    setTimeout(() => {
      this.mostrandoMensaje = false;
      this.mensajeExito = '';
    }, 5000);
  }

  // Mostrar mensaje de error
  mostrarError(mensaje: string) {
    this.mensajeError = mensaje;
    this.mensajeExito = '';
    this.mostrandoMensaje = true;
    setTimeout(() => {
      this.mostrandoMensaje = false;
      this.mensajeError = '';
    }, 7000);
  }

  // Obtener nombre del producto (compatibilidad)
  obtenerNombre(producto: Producto): string {
    const nombre = producto.nombre_producto || producto.nombre;
    return nombre?.trim() || 'Sin nombre';
  }

  // Obtener código del producto (compatibilidad)
  obtenerCodigo(producto: Producto): string {
    const codigo = producto.codigo_producto || producto.codigo;
    return codigo?.trim() || 'Sin código';
  }

  // Debug: mostrar información completa del producto
  debugProducto(producto: Producto) {
    console.log('Producto completo:', JSON.stringify(producto, null, 2));
  }

  // ============================================
  // BÚSQUEDA Y FILTRADO
  // ============================================

  aplicarFiltros() {
    let filtrados = [...this.productos];

    // Filtro por texto de búsqueda
    if (this.busquedaTexto.trim()) {
      const termino = this.busquedaTexto.toLowerCase().trim();
      filtrados = filtrados.filter(p => 
        this.obtenerCodigo(p).toLowerCase().includes(termino) ||
        this.obtenerNombre(p).toLowerCase().includes(termino) ||
        (p.descripcion?.toLowerCase() || '').includes(termino) ||
        (p.categoria?.toLowerCase() || '').includes(termino)
      );
    }

    // Filtro por categoría
    if (this.filtroCategoria) {
      filtrados = filtrados.filter(p => p.categoria === this.filtroCategoria);
    }

    // Filtro por estado
    if (this.filtroEstado) {
      filtrados = filtrados.filter(p => p.estado === this.filtroEstado);
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
          case 'codigo':
            valorA = this.obtenerCodigo(a).toLowerCase();
            valorB = this.obtenerCodigo(b).toLowerCase();
            break;
          case 'nombre':
            valorA = this.obtenerNombre(a).toLowerCase();
            valorB = this.obtenerNombre(b).toLowerCase();
            break;
          case 'categoria':
            valorA = (a.categoria || '').toLowerCase();
            valorB = (b.categoria || '').toLowerCase();
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

    this.productosFiltrados = filtrados;
    this.paginaActual = 1; // Resetear a primera página al filtrar
  }

  limpiarFiltros() {
    this.busquedaTexto = '';
    this.filtroCategoria = '';
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
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.registrosPorPagina));
  }

  get productosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
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
    if (this.productosFiltrados.length === 0) {
      this.mostrarError('No hay productos para exportar');
      return;
    }

    const headers = ['ID', 'Código', 'Nombre', 'Descripción', 'Categoría', 'Unidad de Medida', 'Estado', 'Fecha Creación'];
    const filas = this.productosFiltrados.map(p => [
      p.id?.toString() || '',
      this.obtenerCodigo(p),
      this.obtenerNombre(p),
      p.descripcion || '',
      p.categoria || '',
      p.unidad_medida || '',
      p.estado || '',
      p.created_at ? new Date(p.created_at).toLocaleString() : ''
    ]);

    const csv = [
      headers.join(','),
      ...filas.map(fila => fila.map(campo => `"${campo.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.mostrarExito('Productos exportados exitosamente');
  }
}
