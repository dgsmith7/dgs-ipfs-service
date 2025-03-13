// contact form buttons
let form = document.querySelector("#contact-form");
document.querySelector("#send-contact").addEventListener("click", (event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  validate();
});

let formReset = document.querySelector("#contact-button-response");
formReset.addEventListener("click", (event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  resetForm();
});

// mail functionality
function validate() {
  let formValid = true;
  if (!form.checkValidity()) {
    formValid = false;
  }
  form.classList.add("was-validated");
  if (formValid) {
    sendTheEmail();
  }
  return false;
}

function resetForm() {
  document.querySelector("#contact-first").value = "";
  document.querySelector("#contact-last").value = "";
  document.querySelector("#contact-message").value = "";
  document.querySelector("#contact-email").value = "";
  document.querySelector("#contact-button-response").innerHTML = "Reset Form";
  document.querySelector("#contact-form").classList.remove("was-validated");
}

function sendTheEmail() {
  let obj = {
    sub: `${document.querySelector("#contact-first").value} ${
      document.querySelector("#contact-last").value
    } from NFT mint contact form!`,
    txt: `${document.querySelector("#contact-first").value} ${
      document.querySelector("#contact-last").value
    } sent you a message from the contact form on the NFT mint that reads as so: \n${
      document.querySelector("#contact-message").value
    }\nTheir email address is ${
      document.querySelector("#contact-email").value
    }`,
    ftb: document.querySelector("#ftb").value == "",
  };
  fetch("/mail", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(obj),
  })
    .then((r) => r.json())
    .then((response) => {
      document.querySelector("#contact-button-response").innerHTML =
        response.result + " - Reset Form";
    })
    .catch((err) => {
      console.log(
        "We were unable to send your message due to an internal error - ",
        err
      );
    });
}
