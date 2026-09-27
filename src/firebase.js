import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCxDcRVw3ZTyicq96bFkZdnb97_l0UWMs",
  authDomain: "bank-sampah-berseri.firebaseapp.com",
  projectId: "bank-sampah-berseri",
  storageBucket: "bank-sampah-berseri.firebasestorage.app",
  messagingSenderId: "892348658354",
  appId: "1:892348658354:web:ac21d1594ab0862f4c0fab"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);