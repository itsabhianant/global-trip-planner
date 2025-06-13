import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.css']
})
export class AuthLoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  email: string = '';
  password: string = '';

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then(result => {
        console.log('✅ Google signed in:', result.user);
        this.router.navigate(['/']);
      })
      .catch(error => {
        console.error('❌ Google login error:', error);
        alert(error.message);
      });
  }

  loginWithEmail() {
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then(result => {
        console.log('✅ Email login success:', result.user);
        this.router.navigate(['/']);
      })
      .catch(error => {
        console.error('❌ Email login error:', error);
        alert(error.message);
      });
  }
}
