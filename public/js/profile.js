document.addEventListener("DOMContentLoaded", () => {
  // grab the pin list from the page, trimming any extraneous whitespace first
  let pinList = JSON.parse(
    document.querySelector("#data-store").textContent.trim()
  );
  let visibleCIDs = [];
  pinList.forEach((pin) => {
    visibleCIDs.push(pin.cid);
  });

  // Updated event listeners for individual "Unpin" buttons to use full cid from pinList
  for (let i = 0; i < pinList.length; i++) {
    const button = document.getElementById(`unpin-button-${i}`);
    if (button) {
      button.addEventListener("click", async () => {
        // Use the full cid directly from pinList instead of the shortened version in the DOM.
        const cid = pinList[i].cid;
        console.log("Unpinning full cid:", cid);
        console.log({ cids: [cid] });
        document.querySelector("#loading").classList.remove("invisible");
        try {
          const response = await fetch("/protected/profile/unpinBatch", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cids: [cid] }),
          });
          const data = await response.json();
          console.log("Unpin response:", data);
          window.location.href = "/protected/profile/refresh";
        } catch (err) {
          console.error("Error unpinning pin:", err);
          alert("Error unpinning pin");
        }
        document.querySelector("#loading").classList.add("invisible");
      });
    }
  }

  // event listeners for individual checkboxes and set initial values
  for (let i = 0; i < pinList.length; i++) {
    const box = document.querySelector(`#check-${i}`);
    box.checked = false;
    box.addEventListener("change", (event) => {
      if (event.target.checked) {
        pinList[i].selected = true;
      } else {
        pinList[i].selected = false;
        let allBox = document.querySelector("#check-all-box");
        allBox.checked = false;
      }
    });
  }

  // event listener for check or uncheck all
  let allBox = document.querySelector("#check-all-box");
  allBox.addEventListener("change", (event) => {
    pinList.forEach((pin, idx) => {
      let boxId = "#check-" + idx;
      let box = document.querySelector(boxId);
      if (visibleCIDs.includes(pin.cid)) {
        if (event.target.checked) {
          pin.selected = true;
          box.checked = true;
        } else {
          pin.selected = false;
          box.checked = false;
        }
      }
    });
  });

  // Updated event listener for "unpin checked" button
  let unpinCheckedButton = document.querySelector("#unpin-checked-button");
  unpinCheckedButton.addEventListener("click", async () => {
    try {
      let unpinList = [];
      pinList.forEach((pin) => {
        if (pin.selected === true) {
          unpinList.push(pin.cid);
        }
      });
      if (unpinList.length > 0) {
        document.querySelector("#loading").classList.remove("invisible");
        document.querySelector("#loading").classList.add("visible");
        const batchSize = 10;
        for (let i = 0; i < unpinList.length; i += batchSize) {
          let batch = unpinList.slice(i, i + batchSize);
          await fetch("/protected/profile/unpinBatch", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cids: batch }),
          });
        }
        document.querySelector("#loading").classList.add("invisible");
        document.querySelector("#loading").classList.remove("visible");
        // After unpinning all batches, redirect to refresh updated user data
        window.location.href = "/protected/profile/refresh";
      }
    } catch (err) {
      console.error("Error unpinning checked items:", err);
      alert("Error unpinning items.");
    }
  });

  // event listener for search box
  let searchBox = document.querySelector("#search-term");
  searchBox.addEventListener("keyup", (event) => {
    updateVisible();
  });

  // search box filtering functionality
  function updateVisible() {
    visibleCIDs.length = 0;
    let filter = document.querySelector("#search-term").value;
    pinList.forEach((pin, idx) => {
      let rowId = "#row-for-" + idx;
      let row = document.querySelector(rowId);
      if (
        pin.cid.includes(filter) ||
        pin.name.includes(filter) ||
        pin.cid.toUpperCase().includes(filter.toUpperCase()) ||
        pin.name.toUpperCase().includes(filter.toUpperCase())
      ) {
        row.classList.remove("d-none");
        visibleCIDs.push(pin.cid);
      } else {
        row.classList.add("d-none");
      }
    });
  }

  // Updated event handler for email
  let sendButton = document.querySelector("#send-message");
  sendButton.addEventListener("click", async (event) => {
    event.preventDefault();
    // Retrieve the username from the profile card (adjust selector as needed)
    const userName = document.querySelector("#profile-card p.fs-4").textContent;
    const messageText = document.querySelector("#message-text").value;
    const message = `Message from ${userName}:\n${messageText}`;
    try {
      const response = await fetch("/mail", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub: "Contact from Pinning Service",
          txt: message,
        }),
      });
      const data = await response.json();
      console.log("Email sent:", data);
      alert("Message sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send email");
    }
  });

  // Updated event handler for the "Generate Key" button
  let newKeyButton = document.querySelector("#new-key");
  newKeyButton.addEventListener("click", async () => {
    try {
      const r = await fetch("/protected/profile/generateApiKey", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (r.ok) {
        const data = await r.json();
        document.querySelector("#key-display").textContent = data.apiKey;
        document.querySelector("#copy-key-button").classList.remove("d-none");
        console.log("New API key generated and displayed.");
      } else {
        console.error("Failed to generate API key");
      }
    } catch (err) {
      console.error("Error generating new API key:", err);
    }
  });

  // Event handler for copy button
  const button = document.getElementById(`copy-key-button`);
  button.addEventListener("click", async () => {
    let copied = [document.querySelector("#key-display").textContent];
    await navigator.clipboard.writeText(copied);
  });

  // TODO event handler for delete account
  let confirmDeleteButton = document.querySelector("#confirm-delete");
  confirmDeleteButton.addEventListener("click", (event) => {
    console.log("Account Deleted.  Pins unpinned.  Logged out.");
    // Account Delete.  Pins unpinn.  Log out.
  });

  document
    .querySelector("#confirm-delete")
    .addEventListener("click", async () => {
      try {
        const r = await fetch("/protected/profile/deleteAccount", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (r.ok) {
          alert("Account deleted successfully.");
          window.location.href = "/logout";
        } else {
          const errResp = await r.json();
          alert("Error deleting account: " + errResp.msg);
        }
      } catch (err) {
        console.error("Error during account deletion:", err);
        alert("Error deleting account.");
      }
    });

  // manage scroll position during refresh
  let scrollpos = localStorage.getItem("scrollpos");
  if (scrollpos) window.scrollTo(0, scrollpos);
  window.onbeforeunload = function (e) {
    localStorage.setItem("scrollpos", window.scrollY);
  };
});
