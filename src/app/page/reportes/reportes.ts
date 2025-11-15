import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

interface ReporteItem {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number;
  estado: 'Activo' | 'Inactivo';
  usuario: string;
  tipo: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes {
  // Filtros de búsqueda
  filtros = {
    fechaInicio: '',
    fechaFin: '',
    tipoReporte: '',
    usuario: '',
    estado: ''
  };

  // Tipos de reporte disponibles
  tiposReporte = [
    { valor: '', texto: 'Seleccionar tipo' },
    { valor: 'ventas', texto: 'Reporte de Ventas' },
    { valor: 'usuarios', texto: 'Reporte de Usuarios' },
    { valor: 'productos', texto: 'Reporte de Productos' },
    { valor: 'inventario', texto: 'Reporte de Inventario' }
  ];

  // Estados disponibles
  estados = [
    { valor: '', texto: 'Todos los estados' },
    { valor: '1', texto: 'Activo' },
    { valor: '0', texto: 'Inactivo' }
  ];

  // Datos de ejemplo para la tabla (simulados)
  private readonly datosSimulados: ReporteItem[] = [
    { id: 1, fecha: '2024-01-15', descripcion: 'Venta de productos electrónicos', monto: 150000, estado: 'Activo', usuario: 'mrivera', tipo: 'ventas' },
    { id: 2, fecha: '2024-01-16', descripcion: 'Venta de ropa', monto: 75000, estado: 'Activo', usuario: 'jhernandez', tipo: 'ventas' },
    { id: 3, fecha: '2024-01-17', descripcion: 'Venta de libros', monto: 45000, estado: 'Inactivo', usuario: 'klopez', tipo: 'ventas' },
    { id: 4, fecha: '2024-01-18', descripcion: 'Venta de accesorios', monto: 32000, estado: 'Activo', usuario: 'mrivera', tipo: 'ventas' },
    { id: 5, fecha: '2024-01-20', descripcion: 'Registro nuevo usuario', monto: 0, estado: 'Activo', usuario: 'admin', tipo: 'usuarios' },
    { id: 6, fecha: '2024-01-21', descripcion: 'Desactivación de usuario', monto: 0, estado: 'Inactivo', usuario: 'jhernandez', tipo: 'usuarios' },
    { id: 7, fecha: '2024-01-21', descripcion: 'Ingreso de inventario', monto: 60000, estado: 'Activo', usuario: 'almacen', tipo: 'inventario' },
    { id: 8, fecha: '2024-01-22', descripcion: 'Ajuste de inventario', monto: 15000, estado: 'Activo', usuario: 'almacen', tipo: 'inventario' },
    { id: 9, fecha: '2024-01-23', descripcion: 'Alta de producto nuevo', monto: 0, estado: 'Activo', usuario: 'compras', tipo: 'productos' },
    { id: 10, fecha: '2024-01-24', descripcion: 'Actualización de catálogo', monto: 0, estado: 'Inactivo', usuario: 'compras', tipo: 'productos' }
  ];

  datosFiltrados: ReporteItem[] = [...this.datosSimulados];
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  totalResultados = this.datosFiltrados.length;
  estaCargando = false;
  ultimaBusqueda: Omit<typeof this.filtros, 'usuario'> & { usuario: string } | null = null;

  private readonly powerBiUrl: SafeResourceUrl;

  constructor(
    private readonly authService: AuthService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.powerBiUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://app.powerbi.com/view?r=eyJrIjoiYzQ5Yzg2ZTYtZjI1Zi00YWRiLWJiNzUtOWEyODAyNzY4ZTk5IiwidCI6IjFlOWFhYmU4LTY3ZjgtNGYxYy1hMzI5LWE3NTRlOTI0OTlhZSIsImMiOjR9'
    );
  }

  get puedeVerPowerBi(): boolean {
    return this.authService.hasRole('admin');
  }

  get iframeUrl(): SafeResourceUrl {
    return this.powerBiUrl;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalResultados / this.registrosPorPagina));
  }

  get datosPaginados(): ReporteItem[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.datosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  buscar() {
    this.estaCargando = true;
    setTimeout(() => {
      this.aplicarFiltros();
      this.ultimaBusqueda = { ...this.filtros };
      this.estaCargando = false;
    }, 400);
  }

  private aplicarFiltros() {
    const { fechaInicio, fechaFin, tipoReporte, usuario, estado } = this.filtros;
    this.datosFiltrados = this.datosSimulados.filter(item => {
      const cumpleTipo = tipoReporte ? item.tipo === tipoReporte : true;
      const cumpleUsuario = usuario ? item.usuario.toLowerCase().includes(usuario.toLowerCase()) : true;
      const cumpleEstado =
        estado === ''
          ? true
          : estado === '1'
            ? item.estado === 'Activo'
            : item.estado === 'Inactivo';
      const cumpleFechaInicio = fechaInicio ? item.fecha >= fechaInicio : true;
      const cumpleFechaFin = fechaFin ? item.fecha <= fechaFin : true;
      return cumpleTipo && cumpleUsuario && cumpleEstado && cumpleFechaInicio && cumpleFechaFin;
    });
    this.totalResultados = this.datosFiltrados.length;
    this.paginaActual = 1;
  }

  // Método para limpiar filtros
  limpiarFiltros() {
    this.filtros = {
      fechaInicio: '',
      fechaFin: '',
      tipoReporte: '',
      usuario: '',
      estado: ''
    };
    this.datosFiltrados = [...this.datosSimulados];
    this.totalResultados = this.datosFiltrados.length;
    this.paginaActual = 1;
    this.ultimaBusqueda = null;
  }

  // Método para exportar reporte
  exportar() {
    if (!this.datosFiltrados.length) {
      alert('No hay información para exportar.');
      return;
    }
    const encabezados = ['ID', 'Fecha', 'Descripción', 'Monto', 'Estado', 'Usuario', 'Tipo'];
    const filas = this.datosFiltrados.map(item => [
      item.id,
      item.fecha,
      item.descripcion,
      item.monto,
      item.estado,
      item.usuario,
      item.tipo
    ]);
    const csvContent =
      [encabezados, ...filas]
        .map(row =>
          row
            .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reportes_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  cambiarPagina(direccion: 'prev' | 'next') {
    if (direccion === 'prev' && this.paginaActual > 1) {
      this.paginaActual--;
    } else if (direccion === 'next' && this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }
}
