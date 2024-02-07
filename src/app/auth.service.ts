import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user!: User | null;
  constructor(private auth: Auth) {}

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((res) => {
        console.log('Successfully signed in!', res);
        this.user = res.user;
      })
      .catch((error) => {
        console.log('Something is wrong:', error.message);
      });
  }
  signOut() {
    this.user = null;
    return signOut(this.auth);
  }
}
