import { Component, inject, EventEmitter, Output } from '@angular/core';

import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router'; // tarvitaan navigateToList() -metodia varten
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  constructor(public authService: AuthService, private router: Router) {}
  private readonly storage: Storage = inject(Storage);
  private readonly db: Firestore = inject(Firestore);
  uploading = false;
  uploadValue = 0;
  @Output() refreshMarkersEvent = new EventEmitter<string>();
  @Output() removeUserEvent = new EventEmitter<string>();
  @Output() locateUserEvent = new EventEmitter<string>();
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.uploadImage(file);
    }
  }
  removeUserLocation() {
    this.removeUserEvent.emit();
  }
  locateUser() {
    this.locateUserEvent.emit();
  }
  login() {
    console.log('ayo');
    this.router.navigate(['login']);
  }
  logOut() {
    this.authService.signOut().then(() => this.router.navigate(['/']));
  }
  uploadImage(file: any) {
    console.log(file);
    this.uploading = true;
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${file.name}`;
    // Get the user's current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // ladataan firebaseen
        const metadata = {
          contentType: file.type,
        };

        const storageRef = ref(this.storage, 'images/' + uniqueFileName);
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.uploadValue = progress;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error('Error uploading image:', error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', downloadURL);

            // lisätään firestorageen kuvan nimi, ja sijainti
            const docRef = await addDoc(collection(this.db, 'images'), {
              url: uniqueFileName,
              latitude,
              longitude,
            });
            console.log('Document written with ID:', docRef.id);
            this.refreshMarkersEvent.emit();
            this.uploading = false;
          }
        );
      },
      (error) => {
        console.error('Error getting user position:', error);
      }
    );
  }
}
