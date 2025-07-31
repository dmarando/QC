// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Import Firestore functionality
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration (using your specific details)
const firebaseConfig = {
  apiKey: "AIzaSyBG613CRDSRr_AWFudziZSOAYg2psb1rYY",
  authDomain: "qc-01-a10f8.firebaseapp.com",
  projectId: "qc-01-a10f8",
  storageBucket: "qc-01-a10f8.firebasestorage.app",
  messagingSenderId: "699119764276",
  appId: "1:699119764276:web:3e2ddd537f1a16581d9b61",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
const db = getFirestore(app);

export { app, db }; // Export both app and db
