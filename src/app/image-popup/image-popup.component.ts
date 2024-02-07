import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
} from '@angular/fire/storage';
import {
  Firestore,
  collection,
  doc,
  deleteDoc,
  query,
  getDocs,
  where,
} from '@angular/fire/firestore';
@Component({
  selector: 'app-image-popup',
  templateUrl: './image-popup.component.html',
  styleUrls: ['./image-popup.component.css'],
})
export class ImagePopupComponent {
  imageSrc = '';
  imagedata = this.data.imageUrl;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ImagePopupComponent>,
    private storage: Storage,
    private readonly db: Firestore
  ) {}
  ngOnInit() {
    console.log(this.data);
    this.retrieveimage();
  }
  close() {
    this.dialogRef.close();
  }
  //haetaan kuva fire storagesta nimen perusteella
  retrieveimage() {
    getDownloadURL(ref(this.storage, 'images/' + this.data.imageUrl))
      .then((url) => {
        console.log('moi');

        this.imageSrc = url;
      })
      .catch((error) => {
        console.log('Error: ' + error);
      });
  }

  //kuvan ja sen dokumentin poistofunktio firebasesta ja storagesta
  imagedeletion = '';
  async deleteimage() {
    const deleteRef = ref(this.storage, 'images/' + this.data.imageUrl);
    console.log(deleteRef);
    const imagesRef = collection(this.db, 'images');
    const q = query(imagesRef, where('url', '==', this.data.imageUrl));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      this.deletething(doc.id);
    });

    deleteObject(deleteRef)
      .then(() => {
        // File deleted successfully
        console.log('file deleted');
        this.close();
      })
      .catch((error) => {
        console.log('Error: ' + error);
      });
  }
  //dokumentin poisto
  async deletething(id: any) {
    deleteDoc(doc(this.db, 'images', id));
    console.log('doc deleted');
  }
}
