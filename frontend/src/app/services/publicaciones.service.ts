import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: string;
  estado: string;
  fechaPublicacion: string;
  usuarioId: number;
  propietario: string;
}

export interface PublicacionDatos {
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl = 'http://localhost:3000/api/publicaciones';

  constructor(private http: HttpClient) {}

  obtenerPublicaciones(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(this.apiUrl);
  }

  obtenerPublicacion(id: number): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }

  crearPublicacion(datos: PublicacionDatos): Observable<any> {
    return this.http.post(this.apiUrl, datos);
  }

  editarPublicacion(
    id: number,
    datos: PublicacionDatos
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos);
  }

  cancelarPublicacion(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancelar`, {});
  }
}