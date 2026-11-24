
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  correo = '';
  password = '';
  error = '';
  cargando = false;

  iniciarSesion(): void {
    this.error = '';
    this.cargando = true;

    this.authService.login({
      correo: this.correo,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'No se pudo iniciar sesión.';
        this.cargando = false;
      }
    });
  }
}
