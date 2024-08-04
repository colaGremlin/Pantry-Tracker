import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
    apiKey: "AIzaSyCfRVZSV6PmoF_gRsj245VRpYPo3ZIIHgI",
    authDomain: "inventory-management-app-69e6a.firebaseapp.com",
    projectId: "inventory-management-app-69e6a",
    storageBucket: "inventory-management-app-69e6a.appspot.com",
    messagingSenderId: "932564971278",
    appId: "1:932564971278:web:79e2200666cefc92de715f",
    measurementId: "G-X3TM92SD7K"
  };


const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);



export { firestore };




