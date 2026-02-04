// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdeMWb5LkZHzwjh-H-Dzuz0_4zqTG7IFU",
  authDomain: "smart-study-llm-b3ba6.firebaseapp.com",
  projectId: "smart-study-llm-b3ba6",
  storageBucket: "smart-study-llm-b3ba6.firebasestorage.app",
  messagingSenderId: "218487360919",
  appId: "1:218487360919:web:84c28cd3f999617407c8d2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);