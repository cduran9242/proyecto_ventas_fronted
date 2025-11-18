import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interfaces para tipado
export interface Usuario {
  id?: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  cedula?: string;
  contrasena?: string;
  rol_id?: number;
  departamento_id?: number;
  ciudad_id?: number;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Producto {
  id?: number;
  codigo_producto: string;
  nombre_producto: string;
  descripcion?: string;
  categoria?: string;
  unidad_medida?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
  // Campos de compatibilidad (legacy)
  nombre?: string;
  codigo?: string;
  precio?: number;
  stock?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface VentaDetalle {
  id?: number;
  id_pedido?: number;
  id_producto: number;
  producto_nombre?: string;
  numero_linea?: number;
  cantidad_solicitada: number;
  cantidad_confirmada?: number;
  precio_unitario: number;
  precio_total?: number;
  precio_extranjero?: number;
  precio_total_extranjero?: number;
  numero_documento?: string;
  tipo_documento?: string;
  estado_siguiente?: number;
  estado_anterior?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VentaPedido {
  id?: number;
  tipo_pedido: string;
  id_cliente: number;
  id_vendedor: number;
  moneda: string;
  trm: number;
  oc_cliente?: string;
  condicion_pago?: string;
  departamento_id?: number;
  ciudad_id?: number;
  created_at?: string;
  updated_at?: string;
  detalles: VentaDetalle[];
}

export interface MenuItemNode {
  id: number;
  modulo_id?: number;
  parent_id?: number;
  nombre: string;
  descripcion?: string;
  ruta?: string;
  icono?: string;
  tipo?: string;
  nivel: number;
  orden: number;
  estado: string;
  permisos?: string[];
  hijos?: MenuItemNode[];
}

export interface RolModuloAsignado {
  id?: number;
  modulo_id: number;
  nombre_modulo?: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  permisos?: string[];
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RolMenuItemAsignado {
  id?: number;
  menu_item_id: number;
  nombre_menu?: string;
  ruta?: string;
  permisos: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Rol {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  modulos?: RolModuloAsignado[];
  menu_items?: RolMenuItemAsignado[];
  menu?: MenuItemNode[];
  created_at?: string;
  updated_at?: string;
}

export interface FavoritoMenuItem {
  id: number;
  usuario_id: number;
  menu_item_id: number;
  alias?: string | null;
  orden?: number | null;
  nombre_menu?: string;
  descripcion_menu?: string;
  ruta?: string;
  icono?: string;
  permisos?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  usuario: Usuario;
  rol: Rol;
  modulos?: MenuItemNode[];
  menu?: MenuItemNode[];
  favoritos?: FavoritoMenuItem[];
}

export interface Modulo {
  id?: number;
  nombre: string;
  descripcion: string;
  ruta: string;
  estado: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemPayload {
  nombre: string;
  descripcion?: string;
  ruta?: string;
  icono?: string;
  tipo?: string;
  modulo_id?: number;
  parent_id?: number;
  orden?: number;
  estado?: string;
}

export interface MenuAssignmentPayload {
  rol_id: number;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export interface FavoritoCreatePayload {
  menu_item_id: number;
  alias?: string | null;
  orden?: number | null;
}

export interface FavoritoUpdatePayload {
  alias?: string | null;
  orden?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000'; // URL de tu FastAPI
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer ' + token // Para autenticación futura
  });

  constructor(private http: HttpClient) {}

  // ========== USUARIOS ==========
  getUsuarios(): Observable<Usuario[]> {
    return this.http
      .get<{ resultado: Usuario[] }>(`${this.baseUrl}/get_users/`)
      .pipe(map(response => response?.resultado ?? []));
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/get_user/${id}`);
  }

  crearUsuario(usuario: Usuario): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.baseUrl}/create_user`,
      usuario,
      { headers: this.headers }
    );
  }

  actualizarUsuario(id: number, usuario: Usuario): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.baseUrl}/update_user/${id}`,
      usuario,
      { headers: this.headers }
    );
  }

  eliminarUsuario(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.baseUrl}/delete_user/${id}`
    );
  }

  // ========== PRODUCTOS ==========
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/productos/`);
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/productos/${id}`);
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}/productos/`, producto, { headers: this.headers });
  }

  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id}`, producto, { headers: this.headers });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productos/${id}`);
  }

  // ========== VENTAS ==========
  getVentas(): Observable<VentaPedido[]> {
    return this.http
      .get<VentaPedido[]>(`${this.baseUrl}/ventas/`)
      .pipe(
        map(response => {
          // El backend devuelve directamente una lista List[VentaResponse]
          if (Array.isArray(response)) {
            // Normalizar los datos: convertir Decimal (que viene como string) a number
            return response.map(venta => ({
              ...venta,
              trm: typeof venta.trm === 'string' ? parseFloat(venta.trm) : (venta.trm || 1),
              detalles: (venta.detalles || []).map((detalle: any) => ({
                ...detalle,
                cantidad_solicitada: typeof detalle.cantidad_solicitada === 'string' 
                  ? parseFloat(detalle.cantidad_solicitada) 
                  : (detalle.cantidad_solicitada || 0),
                cantidad_confirmada: detalle.cantidad_confirmada 
                  ? (typeof detalle.cantidad_confirmada === 'string' 
                      ? parseFloat(detalle.cantidad_confirmada) 
                      : detalle.cantidad_confirmada)
                  : undefined,
                precio_unitario: typeof detalle.precio_unitario === 'string' 
                  ? parseFloat(detalle.precio_unitario) 
                  : (detalle.precio_unitario || 0),
                precio_total: detalle.precio_total 
                  ? (typeof detalle.precio_total === 'string' 
                      ? parseFloat(detalle.precio_total) 
                      : detalle.precio_total)
                  : undefined,
                precio_extranjero: detalle.precio_extranjero 
                  ? (typeof detalle.precio_extranjero === 'string' 
                      ? parseFloat(detalle.precio_extranjero) 
                      : detalle.precio_extranjero)
                  : undefined,
                precio_total_extranjero: detalle.precio_total_extranjero 
                  ? (typeof detalle.precio_total_extranjero === 'string' 
                      ? parseFloat(detalle.precio_total_extranjero) 
                      : detalle.precio_total_extranjero)
                  : undefined,
              }))
            }));
          }
          // Si viene en formato { resultado: [...] } o { data: [...] } (por compatibilidad)
          if (response && typeof response === 'object' && !Array.isArray(response)) {
            const ventasArray = (response as any).resultado || (response as any).data || [];
            return Array.isArray(ventasArray) ? ventasArray : [];
          }
          return [];
        }),
        // Manejar errores de HTTP
        catchError((error: any) => {
          console.error('❌ Error en getVentas():', error);
          // Si es un error HTTP con mensaje del backend
          let mensajeError = 'Error al cargar las ventas';
          if (error?.error?.detail) {
            mensajeError = error.error.detail;
          } else if (error?.error && typeof error.error === 'string') {
            mensajeError = error.error;
          } else if (error?.message) {
            mensajeError = error.message;
          }
          return throwError(() => new Error(mensajeError));
        })
      );
  }

  getVenta(id: number): Observable<VentaPedido> {
    return this.http.get<VentaPedido>(`${this.baseUrl}/ventas/${id}`);
  }

  crearVenta(venta: VentaPedido): Observable<VentaPedido> {
    return this.http.post<VentaPedido>(`${this.baseUrl}/ventas/`, venta, { headers: this.headers });
  }

  actualizarVenta(id: number, venta: VentaPedido): Observable<VentaPedido> {
    return this.http.put<VentaPedido>(`${this.baseUrl}/ventas/${id}`, venta, { headers: this.headers });
  }

  eliminarVenta(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.baseUrl}/ventas/${id}`);
  }

  // ========== ROLES ==========
  getRoles(): Observable<Rol[]> {
    return this.http
      .get<{ resultado: Rol[] }>(`${this.baseUrl}/get_roles/`)
      .pipe(map(response => response?.resultado ?? []));
  }

  getRol(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.baseUrl}/get_rol/${id}`);
  }

  crearRol(rol: Rol): Observable<{ mensaje: string; id: number }> {
    return this.http.post<{ mensaje: string; id: number }>(
      `${this.baseUrl}/create_rol`,
      rol,
      { headers: this.headers }
    );
  }

  actualizarRol(id: number, rol: Rol): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.baseUrl}/update_rol/${id}`,
      rol,
      { headers: this.headers }
    );
  }

  eliminarRol(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.baseUrl}/delete_rol/${id}`
    );
  }

  // ========== MODULOS ==========
  getModulos(): Observable<Modulo[]> {
    return this.http
      .get<{ resultado: Modulo[] }>(`${this.baseUrl}/get_modulos/`)
      .pipe(map(response => response?.resultado ?? []));
  }

  getModulo(id: number): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.baseUrl}/get_modulo/${id}`);
  }

  getModulosActivos(): Observable<Modulo[]> {
    return this.http
      .get<{ resultado: Modulo[] }>(`${this.baseUrl}/get_modulos_activos/`)
      .pipe(map(response => response?.resultado ?? []));
  }

  crearModulo(modulo: Modulo): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.baseUrl}/create_modulo`,
      modulo,
      { headers: this.headers }
    );
  }

  actualizarModulo(id: number, modulo: Modulo): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.baseUrl}/update_modulo/${id}`,
      modulo,
      { headers: this.headers }
    );
  }

  eliminarModulo(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.baseUrl}/delete_modulo/${id}`
    );
  }

  // ========== REPORTES ==========
  getReportes(filtros?: any): Observable<any[]> {
    let url = `${this.baseUrl}/reportes/`;
    if (filtros) {
      const params = new URLSearchParams(filtros).toString();
      url += `?${params}`;
    }
    return this.http.get<any[]>(url);
  }

  // ========== MENÚ ==========
  getMenuTree(): Observable<MenuItemNode[]> {
    return this.http
      .get<MenuItemNode[]>(`${this.baseUrl}/menu/tree`);
  }

  getMenuTreeByRole(rolId: number): Observable<MenuItemNode[]> {
    return this.http.get<MenuItemNode[]>(`${this.baseUrl}/menu/tree/${rolId}`);
  }

  listMenuItems(): Observable<any> {
    return this.http.get(`${this.baseUrl}/menu/items`);
  }

  createMenuItem(payload: MenuItemPayload): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.baseUrl}/menu/items`,
      payload,
      { headers: this.headers }
    );
  }

  updateMenuItem(id: number, payload: MenuItemPayload): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.baseUrl}/menu/items/${id}`,
      payload,
      { headers: this.headers }
    );
  }

  deleteMenuItem(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.baseUrl}/menu/items/${id}`);
  }

  assignMenuItem(id: number, payload: MenuAssignmentPayload): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.baseUrl}/menu/items/${id}/assign`,
      payload,
      { headers: this.headers }
    );
  }

  // ========== FAVORITOS ==========
  getFavoritosUsuario(usuarioId: number, rolId?: number): Observable<FavoritoMenuItem[]> {
    const query = rolId != null ? `?rol_id=${rolId}` : '';
    return this.http.get<FavoritoMenuItem[]>(
      `${this.baseUrl}/usuarios/${usuarioId}/favoritos${query}`
    );
  }

  crearFavorito(
    usuarioId: number,
    payload: FavoritoCreatePayload,
    rolId?: number
  ): Observable<FavoritoMenuItem> {
    const query = rolId != null ? `?rol_id=${rolId}` : '';
    return this.http.post<FavoritoMenuItem>(
      `${this.baseUrl}/usuarios/${usuarioId}/favoritos${query}`,
      payload,
      { headers: this.headers }
    );
  }

  actualizarFavorito(
    usuarioId: number,
    favoritoId: number,
    payload: FavoritoUpdatePayload,
    rolId?: number
  ): Observable<FavoritoMenuItem> {
    const query = rolId != null ? `?rol_id=${rolId}` : '';
    return this.http.patch<FavoritoMenuItem>(
      `${this.baseUrl}/usuarios/${usuarioId}/favoritos/${favoritoId}${query}`,
      payload,
      { headers: this.headers }
    );
  }

  eliminarFavorito(usuarioId: number, favoritoId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.baseUrl}/usuarios/${usuarioId}/favoritos/${favoritoId}`
    );
  }

  // ========== AUTENTICACIÓN ==========
  login(credenciales: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credenciales, {
      headers: this.headers
    });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { headers: this.headers });
  }

  // ========== UTILIDADES ==========
  private handleError(error: any): Observable<never> {
    console.error('Error en API:', error);
    throw error;
  }
}
