import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

interface LoginRespuesta {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

interface RegistroRespuesta {
  mensaje: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/usuarios';

  private usuarioSubject = new BehaviorSubject<Usuario | null>(
    this.obtenerUsuarioGuardado()
  );

  usuarioActual$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  get usuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  registrar(datos: {
    nombre: string;
    correo: string;
    password: string;
  }): Observable<RegistroRespuesta> {
    return this.http.post<RegistroRespuesta>(
      `${this.apiUrl}/registro`,
      datos
    );
  }

  login(datos: {
    correo: string;
    password: string;
  }): Observable<LoginRespuesta> {
    return this.http.post<LoginRespuesta>(
      `${this.apiUrl}/login`,
      datos
    ).pipe(
      tap(respuesta => {
        localStorage.setItem('reuse_token', respuesta.token);
        localStorage.setItem(
          'reuse_usuario',
          JSON.stringify(respuesta.usuario)
        );

        this.usuarioSubject.next(respuesta.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('reuse_token');
    localStorage.removeItem('reuse_usuario');
    this.usuarioSubject.next(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('reuse_token');
  }

  private obtenerUsuarioGuardado(): Usuario | null {
    const usuario = localStorage.getItem('reuse_usuario');

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as Usuario;
    } catch {
      return null;
    }
  }
}