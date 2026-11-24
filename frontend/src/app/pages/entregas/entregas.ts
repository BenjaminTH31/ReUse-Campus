import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  EntregasService,
  Entrega
} from '../../services/entregas.service';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-entregas',
  imports: [DatePipe],
  templateUrl: './entregas.html',
  styles: [`
    .contenedor { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
    .tarjeta { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 15px 0; }
    .boton { background: #16834a; color: white; border: 0; border-radius: 7px; padding: 10px 15px; cursor: pointer; }
    .mensaje { padding: 12px; background: #ecfdf5; color: #166534; border-radius: 7px; }
    .error { padding: 12px; background: #fef2f2; color: #b91c1c; border-radius: 7px; }
  `]
})
export class Entregas implements OnInit {
  private entregasService = inject(EntregasService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  entregas: Entrega[] = [];
  cargando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarEntregas();
  }

  get usuarioActual() {
    return this.authService.usuarioActual;
  }

  esParticipante(entrega: Entrega): boolean {
    const id = this.usuarioActual?.id;

    return id === entrega.propietarioId ||
      id === entrega.receptorId;
  }

    cargarEntregas(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.entregasService.obtenerMisEntregas().subscribe({
      next: datos => {
        this.entregas = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudieron cargar las entregas.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  completar(id: number): void {
    if (!confirm('¿Confirmas que la entrega fue realizada?')) return;

    this.entregasService.completarEntrega(id).subscribe({
      next: respuesta => {
        this.mensaje = respuesta?.mensaje ||
          'Entrega completada correctamente.';
        this.cargarEntregas();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudo completar la entrega.';
      }
    });
  }
}