import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  user$ = new BehaviorSubject<User | null>(null);

  constructor() {
    this.auth.onAuthStateChanged(user => {
      this.user$.next(user);
    });
  }

  loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider).then(result => {
      this.user$.next(result.user);
    });
  }

  logout(): Promise<void> {
    return signOut(this.auth).then(() => {
      this.user$.next(null);
    });
  }
}
