import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class Ventas {
  // Formulario de nueva venta
  nuevaVenta = {
    cliente: '',
    producto: '',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0,
    fecha: new Date().toISOString().split('T')[0]
  };

  // Lista de productos disponibles
  productos = [
    { id: 1, nombre: 'Laptop HP Pavilion', precio: 2500000, stock: 15 },
    { id: 2, nombre: 'Mouse Inalámbrico', precio: 45000, stock: 50 },
    { id: 3, nombre: 'Teclado Mecánico', precio: 120000, stock: 25 },
    { id: 4, nombre: 'Monitor 24"', precio: 800000, stock: 10 },
    { id: 5, nombre: 'Auriculares Gaming', precio: 180000, stock: 30 }
  ];

  // Lista de ventas (simuladas)
  ventas = [
    { id: 1, cliente: 'Juan Pérez', producto: 'Laptop HP Pavilion', cantidad: 1, total: 2500000, fecha: '2024-01-15', estado: 'Completada' },
    { id: 2, cliente: 'María García', producto: 'Mouse Inalámbrico', cantidad: 2, total: 90000, fecha: '2024-01-16', estado: 'Completada' },
    { id: 3, cliente: 'Carlos López', producto: 'Teclado Mecánico', cantidad: 1, total: 120000, fecha: '2024-01-17', estado: 'Pendiente' }
  ];

  // Método para calcular total
  calcularTotal() {
    const subtotal = this.nuevaVenta.cantidad * this.nuevaVenta.precioUnitario;
    const descuento = (subtotal * this.nuevaVenta.descuento) / 100;
    return subtotal - descuento;
  }

  // Método para seleccionar producto
  seleccionarProducto() {
    const producto = this.productos.find(p => p.nombre === this.nuevaVenta.producto);
    if (producto) {
      this.nuevaVenta.precioUnitario = producto.precio;
    }
  }

  // Método para crear venta (sin funcionalidad real)
  crearVenta() {
    console.log('Nueva venta:', this.nuevaVenta);
    // TODO: Implementar creación con FastAPI
    alert('Funcionalidad de creación pendiente de implementar');
  }

  // Método para editar venta
  editarVenta(venta: any) {
    console.log('Editando venta:', venta);
    // TODO: Implementar edición
    alert('Funcionalidad de edición pendiente de implementar');
  }

  // Método para eliminar venta (cambiar estado)
  eliminarVenta(venta: any) {
    console.log('Eliminando venta:', venta);
    // TODO: Implementar eliminación lógica (estado = 0)
    alert('Funcionalidad de eliminación pendiente de implementar');
  }
}
