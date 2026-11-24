import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Entrega {
  id: number;
  publicacionId: number;
  solicitudId: number;
  propietarioId: number;
  receptorId: number;
  fechaAcuerdo: string;
  fechaEntrega: string | null;
  estado: string;
  titulo: string;
  propietario: string;
  receptor: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntregasService {
  private apiUrl = 'http://localhost:3000/api/entregas';

  constructor(private http: HttpClient) {}

  obtenerMisEntregas(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/mis-entregas`
    );
  }

  completarEntrega(id: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/completar`,
      {}
    );
  }
}