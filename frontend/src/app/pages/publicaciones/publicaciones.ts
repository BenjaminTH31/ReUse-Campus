
import { Component, OnInit, inject } from '@angular/core';
import { PublicacionesService, Publicacion } from '../../services/publicaciones.service';

@Component({
  selector: 'app-publicaciones',
  templateUrl: './publicaciones.html'
})
export class Publicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);

  publicaciones: Publicacion[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.cargando = true;
    this.error = '';

    this.publicacionesService.obtenerPublicaciones().subscribe({
      next: (datos) => {
        this.publicaciones = datos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las publicaciones. Comprueba que el servidor esté funcionando.';
        this.cargando = false;
      }
    });
  }
}
