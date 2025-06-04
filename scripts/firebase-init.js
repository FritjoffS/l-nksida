// Firebase configuration and initialization
var firebaseConfig = {
  apiKey: "AIzaSyDOFeJ1GvtXtffzCwQFg2M3CCVtpn875KQ",
  authDomain: "l-nksida.firebaseapp.com",
  databaseURL: "https://l-nksida-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "l-nksida",
  storageBucket: "l-nksida.firebasestorage.app",
  messagingSenderId: "258147870107",
  appId: "1:258147870107:web:ce637517bc30b7578cad3e"
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
