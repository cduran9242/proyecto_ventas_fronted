import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  marca: string;
  codigo: string;
  fechaVencimiento?: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Venta {
  id?: number;
  cliente: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
  fecha: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface RolModulo {
  id?: number;
  modulo_id: number;
  nombre_modulo?: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  permisos: string[];
  estado: string;
  created_at?: string;
  updated_at?: string;
}

export interface Rol {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  modulos?: RolModulo[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  usuario: Usuario;
  rol: Rol;
  modulos: RolModulo[];
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
  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.baseUrl}/ventas/`);
  }

  getVenta(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.baseUrl}/ventas/${id}`);
  }

  crearVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(`${this.baseUrl}/ventas/`, venta, { headers: this.headers });
  }

  actualizarVenta(id: number, venta: Venta): Observable<Venta> {
    return this.http.put<Venta>(`${this.baseUrl}/ventas/${id}`, venta, { headers: this.headers });
  }

  eliminarVenta(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ventas/${id}`);
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

  // ========== AUTENTICACIÓN (Para implementar en el futuro) ==========
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
