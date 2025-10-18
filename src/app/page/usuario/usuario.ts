import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class Usuario {
  // Formulario de nuevo usuario
  nuevoUsuario = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    rol: '',
    fechaNacimiento: '',
    genero: '',
    estado: '1'
  };

  // Lista de roles disponibles
  roles = [
    { valor: '', texto: 'Seleccionar rol' },
    { valor: 'admin', texto: 'Administrador' },
    { valor: 'vendedor', texto: 'Vendedor' },
    { valor: 'cliente', texto: 'Cliente' },
    { valor: 'inventario', texto: 'Inventario' }
  ];

  // Lista de géneros
  generos = [
    { valor: '', texto: 'Seleccionar género' },
    { valor: 'M', texto: 'Masculino' },
    { valor: 'F', texto: 'Femenino' },
    { valor: 'O', texto: 'Otro' }
  ];

  // Lista de usuarios (simulados)
  usuarios = [
    { 
      id: 1, 
      nombre: 'Juan', 
      apellido: 'Pérez', 
      email: 'juan.perez@email.com', 
      telefono: '3001234567',
      rol: 'Administrador',
      estado: 'Activo',
      fechaCreacion: '2024-01-15'
    },
    { 
      id: 2, 
      nombre: 'María', 
      apellido: 'García', 
      email: 'maria.garcia@email.com', 
      telefono: '3007654321',
      rol: 'Vendedor',
      estado: 'Activo',
      fechaCreacion: '2024-01-16'
    },
    { 
      id: 3, 
      nombre: 'Carlos', 
      apellido: 'López', 
      email: 'carlos.lopez@email.com', 
      telefono: '3009876543',
      rol: 'Cliente',
      estado: 'Inactivo',
      fechaCreacion: '2024-01-17'
    }
  ];

  // Método para crear usuario (sin funcionalidad real)
  crearUsuario() {
    console.log('Nuevo usuario:', this.nuevoUsuario);
    // TODO: Implementar creación con FastAPI
    alert('Funcionalidad de creación pendiente de implementar');
  }

  // Método para editar usuario
  editarUsuario(usuario: any) {
    console.log('Editando usuario:', usuario);
    // TODO: Implementar edición
    alert('Funcionalidad de edición pendiente de implementar');
  }

  // Método para eliminar usuario (cambiar estado)
  eliminarUsuario(usuario: any) {
    console.log('Eliminando usuario:', usuario);
    // TODO: Implementar eliminación lógica (estado = 0)
    alert('Funcionalidad de eliminación pendiente de implementar');
  }

  // Método para limpiar formulario
  limpiarFormulario() {
    this.nuevoUsuario = {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
      rol: '',
      fechaNacimiento: '',
      genero: '',
      estado: '1'
    };
  }
}
