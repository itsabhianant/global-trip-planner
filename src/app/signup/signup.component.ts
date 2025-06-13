import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  email = '';
  password = '';
  error = '';
  
  private auth = inject(Auth);
  private router = inject(Router);

  signup() {
    createUserWithEmailAndPassword(this.auth, this.email, this.password)
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch(err => {
        console.error(err);
        this.error = 'Sign up failed: ' + (err.message || 'Unknown error');
      });
  }

  ngOnInit(): void {
    document.body.classList.add('signup-page');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('signup-page');
  }


}
