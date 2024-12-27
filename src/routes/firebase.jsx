// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCETFdaJs27ddV4mOzvkPeZzIcH4UFzuCw",
  authDomain: "examscheduler-933de.firebaseapp.com",
  databaseURL: "https://examscheduler-933de-default-rtdb.firebaseio.com",
  projectId: "examscheduler-933de",
  storageBucket: "examscheduler-933de.firebasestorage.app",
  messagingSenderId: "705195077581",
  appId: "1:705195077581:web:19618811fab1b228995e84"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


export {app,db}