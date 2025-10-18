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

  // Lista de permisos disponibles (módulos del sistema)
  permisosDisponibles = [
    { 
      id: 'usuario', 
      nombre: 'Módulo Usuario', 
      descripcion: 'Gestión de usuarios del sistema',
      icono: '👥'
    },
    { 
      id: 'perfil', 
      nombre: 'Módulo Perfil', 
      descripcion: 'Administración de perfiles y roles',
      icono: '🔐'
    },
    { 
      id: 'factura', 
      nombre: 'Módulo Factura', 
      descripcion: 'Gestión de facturación',
      icono: '📄'
    },
    { 
      id: 'bodega', 
      nombre: 'Módulo Bodega', 
      descripcion: 'Control de inventario y almacén',
      icono: '🏪'
    },
    { 
      id: 'cliente', 
      nombre: 'Módulo Cliente', 
      descripcion: 'Gestión de clientes',
      icono: '👤'
    },
    { 
      id: 'proveedor', 
      nombre: 'Módulo Proveedor', 
      descripcion: 'Administración de proveedores',
      icono: '🚚'
    },
    { 
      id: 'punto_venta', 
      nombre: 'Módulo Punto de Venta', 
      descripcion: 'Sistema de punto de venta',
      icono: '💳'
    },
    { 
      id: 'calendario', 
      nombre: 'Módulo Calendario', 
      descripcion: 'Gestión de calendarios y eventos',
      icono: '📅'
    },
    { 
      id: 'ciudad', 
      nombre: 'Módulo Ciudad', 
      descripcion: 'Administración de ciudades',
      icono: '🏙️'
    },
    { 
      id: 'marca', 
      nombre: 'Módulo Marca', 
      descripcion: 'Gestión de marcas',
      icono: '🏷️'
    },
    { 
      id: 'productos', 
      nombre: 'Módulo Productos', 
      descripcion: 'Catálogo de productos',
      icono: '📦'
    },
    { 
      id: 'combo', 
      nombre: 'Módulo Combo', 
      descripcion: 'Gestión de combos y paquetes',
      icono: '🎁'
    },
    { 
      id: 'reporte', 
      nombre: 'Módulo Reporte', 
      descripcion: 'Generación de reportes',
      icono: '📊'
    },
    { 
      id: 'correo', 
      nombre: 'Módulo Correo', 
      descripcion: 'Sistema de correo electrónico',
      icono: '📧'
    },
    { 
      id: 'tipo_producto', 
      nombre: 'Módulo Tipo Producto', 
      descripcion: 'Clasificación de tipos de productos',
      icono: '🏷️'
    }
  ];

  // Lista de roles (simulados)
  roles = [
    { 
      id: 1, 
      nombre: 'ADMINISTRADOR', 
      descripcion: 'Acceso completo al sistema',
      permisos: ['usuario', 'perfil', 'factura', 'bodega', 'cliente', 'proveedor', 'punto_venta', 'calendario', 'ciudad', 'marca', 'productos', 'combo', 'reporte', 'correo', 'tipo_producto'],
      estado: 'Activo',
      fechaCreacion: '2024-01-15',
      usuariosAsignados: 2
    },
    { 
      id: 2, 
      nombre: 'FACTURADOR', 
      descripcion: 'Acceso a facturación y ventas',
      permisos: ['cliente', 'factura', 'punto_venta', 'productos', 'reporte'],
      estado: 'Activo',
      fechaCreacion: '2024-01-16',
      usuariosAsignados: 3
    },
    { 
      id: 3, 
      nombre: 'BODEGA', 
      descripcion: 'Control de inventario y almacén',
      permisos: ['bodega', 'productos', 'proveedor', 'marca', 'tipo_producto', 'reporte'],
      estado: 'Activo',
      fechaCreacion: '2024-01-17',
      usuariosAsignados: 4
    },
    { 
      id: 4, 
      nombre: 'VENDEDOR', 
      descripcion: 'Acceso a ventas y clientes',
      permisos: ['cliente', 'punto_venta', 'productos', 'combo', 'reporte'],
      estado: 'Activo',
      fechaCreacion: '2024-01-18',
      usuariosAsignados: 6
    },
    { 
      id: 5, 
      nombre: 'VENDEDOR 2', 
      descripcion: 'Acceso limitado a ventas',
      permisos: ['cliente', 'punto_venta', 'productos'],
      estado: 'Activo',
      fechaCreacion: '2024-01-19',
      usuariosAsignados: 2
    },
    { 
      id: 6, 
      nombre: 'OPERARIO', 
      descripcion: 'Acceso básico al sistema',
      permisos: ['productos', 'bodega'],
      estado: 'Activo',
      fechaCreacion: '2024-01-20',
      usuariosAsignados: 8
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
