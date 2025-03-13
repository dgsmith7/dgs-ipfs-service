let loginForm = document.querySelector("#login-form");
let forgotForm = document.querySelector("#forgot-form");
let getOtpForm = document.querySelector("#get-otp");
let newPasswordForm = document.querySelector("#new-password-form");

document.querySelector("#signin-button").addEventListener("click", (event) => {
  validateForm(loginForm, "signin");
});

document.querySelector("#signup-button").addEventListener("click", (event) => {
  validateForm(loginForm, "signup");
});

document.querySelector("#request-otp").addEventListener("click", () => {
  validateForm(getOtpForm, "sendOtp");
});

document.querySelector("#submit-forgot").addEventListener("click", (event) => {
  validateForm(newPasswordForm, "submitNew");
});

function validateForm(form, action) {
  let formValid = true;
  if (!form.checkValidity()) {
    formValid = false;
  }
  form.classList.add("was-validated");
  if (formValid) {
    if (action == "signin") {
      handleSignIn();
    }
    if (action == "signup") {
      handleSignUp();
    }
    if (action == "sendOtp") {
      handleSendOtp();
    }
    if (action == "submitNew") {
      handleForgot();
    }
  }
}

const protocol = window.location.protocol;
const host = window.location.host;

async function handleSignIn() {
  try {
    document.querySelector("#loading").classList.remove("invisible");
    const body = {
      username: loginForm.email.value,
      password: loginForm.password.value,
    };
    const r = await fetch(`/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status !== 201) {
      document.querySelector("#loading").classList.add("invisible");
      loginForm.classList.add("shake");
      setTimeout(() => loginForm.classList.remove("shake"), 500);
      throw new Error("Failed to log in");
    }
    const response = await r.json();
    if (response.token) {
      localStorage.setItem("token", response.token);
      document.cookie = `token=${response.token}; path=/;`;
      window.location.href = "/protected/profile";
    }
    document.querySelector("#loading").classList.add("invisible");
  } catch (err) {
    document.querySelector("#loading").classList.add("invisible");
    loginForm.classList.add("shake");
    setTimeout(() => loginForm.classList.remove("shake"), 500);
    console.error("Error logging in:", err);
  }
}

async function handleSignUp() {
  try {
    const body = {
      username: loginForm.email.value,
      password: loginForm.password.value,
    };
    const r = await fetch(`/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status === 201) {
      console.log("User registered successfully");
    } else {
      console.error("Failed to register user", r.status);
      // Trigger shake animation
      loginForm.classList.add("shake");
      setTimeout(() => loginForm.classList.remove("shake"), 500);
    }
  } catch (err) {
    console.error("Error registering:", err);
    // Trigger shake animation
    loginForm.classList.add("shake");
    setTimeout(() => loginForm.classList.remove("shake"), 500);
  }
}

async function handleSendOtp() {
  try {
    let recipient = document.querySelector("#otp-email").value;
    let body = {
      recipient: recipient,
    };
    const r = await fetch(`/sendotp`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const response = await r.json();
    if (response.message == "success") {
      document.querySelector("#forgot-display").textContent =
        "OTP sent.  Arriving shortly.";
      document.querySelector("#otp").disabled = false;
      document.querySelector("#new-password").disabled = false;
      document.querySelector("#submit-forgot").disabled = false;
    } else {
      document.querySelector("#forgot-display").textContent =
        "There was a problem.";
      document.querySelector("#otp").disabled = true;
      document.querySelector("#new-password").disabled = true;
      document.querySelector("#submit-forgot").disabled = true;
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleForgot() {
  try {
    let email = document.querySelector("#otp-email").value;
    let enteredOtp = document.querySelector("#otp").value;
    let newPassword = document.querySelector("#new-password").value;
    let body = {
      email: email,
      enteredOtp: enteredOtp,
      newPassword: newPassword,
    };
    const r = await fetch(`/validateotp`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const response = await r.json();
    let otpIsValid = response.message == "success";
    document.querySelector("#otp").disabled = true;
    document.querySelector("#new-password").disabled = true;
    document.querySelector("#submit-forgot").disabled = true;
    if (otpIsValid) {
      document.querySelector("#forgot-display").textContent =
        "Your password was reset.";
      reset = true;
    } else {
      document.querySelector("#forgot-display").textContent =
        "Password reset failed.";
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadUserData() {
  document.querySelector("#loading").classList.remove("invisible");
  document.body.style.pointerEvents = "none";
  router.post("/contact", async (req, res) => {
    res.render("contact.ejs");
  });
  setTimeout(() => {
    document.querySelector("#loading").classList.add("invisible");
    document.body.style.pointerEvents = "auto";
    console.log("Loading completed.");
  }, 3000);
  console.log("Loading user data then redirecting.");
}
