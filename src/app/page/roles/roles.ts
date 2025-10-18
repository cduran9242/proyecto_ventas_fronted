import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class Roles {
  // Formulario de nuevo rol
  nuevoRol = {
    nombre: '',
    descripcion: '',
    permisos: {
      ventas: false,
      productos: false,
      usuarios: false,
      reportes: false,
      roles: false
    },
    estado: '1'
  };

  // Lista de permisos disponibles
  permisosDisponibles = [
    { 
      id: 'ventas', 
      nombre: 'Gestión de Ventas', 
      descripcion: 'Crear, editar, consultar y eliminar ventas',
      icono: '💰'
    },
    { 
      id: 'productos', 
      nombre: 'Gestión de Productos', 
      descripcion: 'Administrar catálogo e inventario',
      icono: '📦'
    },
    { 
      id: 'usuarios', 
      nombre: 'Gestión de Usuarios', 
      descripcion: 'Crear y administrar usuarios del sistema',
      icono: '👥'
    },
    { 
      id: 'reportes', 
      nombre: 'Reportes y Análisis', 
      descripcion: 'Generar y consultar reportes',
      icono: '📊'
    },
    { 
      id: 'roles', 
      nombre: 'Gestión de Roles', 
      descripcion: 'Crear y administrar roles y permisos',
      icono: '🔐'
    }
  ];

  // Lista de roles (simulados)
  roles = [
    { 
      id: 1, 
      nombre: 'Administrador', 
      descripcion: 'Acceso completo al sistema',
      permisos: ['ventas', 'productos', 'usuarios', 'reportes', 'roles'],
      estado: 'Activo',
      fechaCreacion: '2024-01-15',
      usuariosAsignados: 2
    },
    { 
      id: 2, 
      nombre: 'Vendedor', 
      descripcion: 'Acceso a ventas y productos',
      permisos: ['ventas', 'productos'],
      estado: 'Activo',
      fechaCreacion: '2024-01-16',
      usuariosAsignados: 5
    },
    { 
      id: 3, 
      nombre: 'Cliente', 
      descripcion: 'Acceso limitado de consulta',
      permisos: ['productos'],
      estado: 'Activo',
      fechaCreacion: '2024-01-17',
      usuariosAsignados: 15
    }
  ];

  // Método para crear rol (sin funcionalidad real)
  crearRol() {
    console.log('Nuevo rol:', this.nuevoRol);
    // TODO: Implementar creación con FastAPI
    alert('Funcionalidad de creación pendiente de implementar');
  }

  // Método para editar rol
  editarRol(rol: any) {
    console.log('Editando rol:', rol);
    // TODO: Implementar edición
    alert('Funcionalidad de edición pendiente de implementar');
  }

  // Método para eliminar rol (cambiar estado)
  eliminarRol(rol: any) {
    console.log('Eliminando rol:', rol);
    // TODO: Implementar eliminación lógica (estado = 0)
    alert('Funcionalidad de eliminación pendiente de implementar');
  }

  // Método para limpiar formulario
  limpiarFormulario() {
    this.nuevoRol = {
      nombre: '',
      descripcion: '',
      permisos: {
        ventas: false,
        productos: false,
        usuarios: false,
        reportes: false,
        roles: false
      },
      estado: '1'
    };
  }

  // Método para seleccionar/deseleccionar todos los permisos
  toggleTodosPermisos() {
    const todosSeleccionados = Object.values(this.nuevoRol.permisos).every(p => p);
    Object.keys(this.nuevoRol.permisos).forEach(key => {
      (this.nuevoRol.permisos as any)[key] = !todosSeleccionados;
    });
  }

  // Método para obtener el valor de un permiso
  getPermisoValue(permisoId: string): boolean {
    return (this.nuevoRol.permisos as any)[permisoId] || false;
  }

  // Método para establecer el valor de un permiso
  setPermisoValue(permisoId: string, value: boolean) {
    (this.nuevoRol.permisos as any)[permisoId] = value;
  }

  // Método para verificar si un rol tiene un permiso específico
  tienePermiso(rol: any, permiso: string): boolean {
    return rol.permisos.includes(permiso);
  }

  // Método para obtener el nombre del permiso
  obtenerNombrePermiso(permisoId: string): string {
    const permiso = this.permisosDisponibles.find(p => p.id === permisoId);
    return permiso ? permiso.nombre : permisoId;
  }

  // Método para obtener el icono del permiso
  getPermisoIcono(permisoId: string): string {
    const permiso = this.permisosDisponibles.find(p => p.id === permisoId);
    return permiso ? permiso.icono : '❓';
  }
}
