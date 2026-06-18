const form = document.getElementById("myForm");

form.addEventListener("submit", function(e) {

    e.preventDefault();

    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    document.getElementById("nameError").innerText = "";
    document.getElementById("emailError").innerText = "";
    document.getElementById("passwordError").innerText = "";
    document.getElementById("confirmError").innerText = "";
    document.getElementById("success").innerText = "";

    let isValid = true;

    if (name.length < 3) {
        document.getElementById("nameError").innerText =
            "Name must be at least 3 characters";
        isValid = false;
    }

    if (!email.includes("@")) {
        document.getElementById("emailError").innerText =
            "Enter a valid email";
        isValid = false;
    }

    if (password.length < 8 || !/\d/.test(password)) {
        document.getElementById("passwordError").innerText =
            "Password must contain 8 characters and 1 number";
        isValid = false;
    }

    if (password !== confirmPassword) {
        document.getElementById("confirmError").innerText =
            "Passwords do not match";
        isValid = false;
    }

    if (isValid) {
        document.getElementById("success").innerText =
            "Form Submitted Successfully";
    }
});