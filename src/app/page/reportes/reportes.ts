import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  datosReporte = [
    { id: 1, fecha: '2024-01-15', descripcion: 'Venta de productos electrónicos', monto: 150000, estado: 'Activo' },
    { id: 2, fecha: '2024-01-16', descripcion: 'Venta de ropa', monto: 75000, estado: 'Activo' },
    { id: 3, fecha: '2024-01-17', descripcion: 'Venta de libros', monto: 45000, estado: 'Inactivo' },
    { id: 4, fecha: '2024-01-18', descripcion: 'Venta de accesorios', monto: 32000, estado: 'Activo' }
  ];

  // Método para realizar búsqueda (sin funcionalidad real)
  buscar() {
    console.log('Filtros aplicados:', this.filtros);
    // TODO: Implementar búsqueda con FastAPI
    alert('Funcionalidad de búsqueda pendiente de implementar');
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
  }

  // Método para exportar reporte
  exportar() {
    // TODO: Implementar exportación
    alert('Funcionalidad de exportación pendiente de implementar');
  }
}
