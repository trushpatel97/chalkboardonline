import { socket } from "./paperSockets.js"
// Initialize Firebase
let firebaseApp;
let auth;

// Fetch Firebase config from server and initialize
async function initializeFirebase() {
  try {
    const response = await fetch('/api/firebase-config');
    const firebaseConfig = await response.json();
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    
    // Set up auth state observer
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        setupUI(user);
        socket.emit("getUsernameFromAuth", user.email);
      } else {
        // User is signed out
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
        setupUI();
        socket.emit("getUsernameFromAuth", -1);
      }
    });
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Call initializeFirebase when the page loads
document.addEventListener('DOMContentLoaded', initializeFirebase);

// signup
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get user info
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;


    // sign up the user
    auth.createUserWithEmailAndPassword(email, password).then(cred => {
        // close the signup modal & reset form
        const modal = document.querySelector('#modal-signup');
        M.Modal.getInstance(modal).close();
        signupForm.reset();
        signupForm.querySelector(".error").innerHTML = "";

        //create new user document in database ONLY if signup is successful
        let today = new Date();
        console.log("ready to save user to database");
        db.collection("users").doc(email).set({
            email: email,
            chalkboards: null,
            username: null
        })
            .then(function (docRef) {
                console.log("SUCCESS: Document written with ID: ", docRef.id);
            })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });
    }).catch(err => {
        signupForm.querySelector(".error").innerHTML = err.message;
    });

});

// logout
const logout = document.querySelector('#logout');
logout.addEventListener('click', (e) => {
    //e.preventDefault();
    auth.signOut();
    document.querySelector(".account-details").innerHTML = `
            <h4>Logged out.</h4>
        `;
    document.getElementById("navEmail").innerHTML = "";
});

// login
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();


    // get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    // log the user in
    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        // close the signup modal & reset form
        const modal = document.querySelector('#modal-login');
        M.Modal.getInstance(modal).close();
        loginForm.reset();
        loginForm.querySelector(".error").innerHTML = "";
    }).catch(err => {
        loginForm.querySelector(".error").innerHTML = err.message;
    });;

});

//delete account
const deleteBtn = document.querySelector('#delete-account');
deleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    auth.currentUser.delete().then(function () {
        // User deleted.
        document.querySelector(".account-details").innerHTML = `
            <h4>Account successfully deleted.</h4>
        `;
        document.getElementById("navEmail").innerHTML = "";
    }).catch(function (error) {
        // An error happened.
        console.log(error);
    });
});
