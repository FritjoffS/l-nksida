// Ensure Firebase is initialized in your project before using this script
document.getElementById("login-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    // Use Firebase Authentication to sign in
    const userCredential = await firebase.auth().signInWithEmailAndPassword(username, password);

    // If successful, hide the login container and show the content
    document.getElementById("login-container").style.display = "none";
    document.getElementById("content").style.display = "block";
  } catch (error) {
    // Handle authentication errors
    const errorElement = document.getElementById("login-error");
    errorElement.style.display = "block";
    errorElement.textContent = error.message;
  }
});
