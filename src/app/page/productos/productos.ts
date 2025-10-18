import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos {
  // Formulario de nuevo producto
  nuevoProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: '',
    marca: '',
    codigo: '',
    fechaVencimiento: '',
    estado: '1'
  };

  // Lista de categorías
  categorias = [
    { valor: '', texto: 'Seleccionar categoría' },
    { valor: 'electronica', texto: 'Electrónica' },
    { valor: 'ropa', texto: 'Ropa' },
    { valor: 'hogar', texto: 'Hogar' },
    { valor: 'deportes', texto: 'Deportes' },
    { valor: 'libros', texto: 'Libros' }
  ];

  // Lista de marcas
  marcas = [
    { valor: '', texto: 'Seleccionar marca' },
    { valor: 'samsung', texto: 'Samsung' },
    { valor: 'apple', texto: 'Apple' },
    { valor: 'sony', texto: 'Sony' },
    { valor: 'nike', texto: 'Nike' },
    { valor: 'adidas', texto: 'Adidas' }
  ];

  // Lista de productos (simulados)
  productos = [
    { 
      id: 1, 
      nombre: 'Laptop HP Pavilion', 
      descripcion: 'Laptop para trabajo y entretenimiento',
      precio: 2500000, 
      stock: 15,
      categoria: 'Electrónica',
      marca: 'HP',
      codigo: 'LAP001',
      estado: 'Activo',
      fechaCreacion: '2024-01-15'
    },
    { 
      id: 2, 
      nombre: 'Mouse Inalámbrico', 
      descripcion: 'Mouse óptico inalámbrico',
      precio: 45000, 
      stock: 50,
      categoria: 'Electrónica',
      marca: 'Logitech',
      codigo: 'MOU001',
      estado: 'Activo',
      fechaCreacion: '2024-01-16'
    },
    { 
      id: 3, 
      nombre: 'Teclado Mecánico', 
      descripcion: 'Teclado mecánico gaming RGB',
      precio: 120000, 
      stock: 25,
      categoria: 'Electrónica',
      marca: 'Razer',
      codigo: 'TEC001',
      estado: 'Inactivo',
      fechaCreacion: '2024-01-17'
    }
  ];

  // Método para crear producto (sin funcionalidad real)
  crearProducto() {
    console.log('Nuevo producto:', this.nuevoProducto);
    // TODO: Implementar creación con FastAPI
    alert('Funcionalidad de creación pendiente de implementar');
  }

  // Método para editar producto
  editarProducto(producto: any) {
    console.log('Editando producto:', producto);
    // TODO: Implementar edición
    alert('Funcionalidad de edición pendiente de implementar');
  }

  // Método para eliminar producto (cambiar estado)
  eliminarProducto(producto: any) {
    console.log('Eliminando producto:', producto);
    // TODO: Implementar eliminación lógica (estado = 0)
    alert('Funcionalidad de eliminación pendiente de implementar');
  }

  // Método para limpiar formulario
  limpiarFormulario() {
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      categoria: '',
      marca: '',
      codigo: '',
      fechaVencimiento: '',
      estado: '1'
    };
  }

  // Método para generar código automático
  generarCodigo() {
    const categoria = this.nuevoProducto.categoria.substring(0, 3).toUpperCase();
    const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.nuevoProducto.codigo = categoria + numero;
  }
}
