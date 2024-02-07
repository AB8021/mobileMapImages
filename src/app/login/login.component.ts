import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router'; // tarvitaan navigateToList() -metodia varten
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  email!: string;
  password!: string;
  constructor(public authService: AuthService, private router: Router) {}
  signIn() {
    this.authService
      .signIn(this.email, this.password)
      .then(() => this.router.navigate(['/']));
    this.email = '';
    this.password = '';
  }
  signOut() {
    this.authService
      .signOut()
      .then(() => (this.authService.user = null))
      .catch((e) => console.log(e.message));
  }
  ngOnInit(): void {}
}
