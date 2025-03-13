document.addEventListener("DOMContentLoaded", () => {
  // Auto-refresh JWT every 14 minutes (840,000 ms)
  setInterval(async () => {
    try {
      const response = await fetch("/refresh-token", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        console.log("Token refreshed:", data.token);
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
    }
  }, 840000);

  // Place Hold button: update user status to "hold" and record hold details.
  document.querySelectorAll(".hold-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const username = button.getAttribute("data-username");
      try {
        const response = await fetch("/protected/admin/hold", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await response.json();
        alert(data.msg);
        window.location.reload();
      } catch (err) {
        console.error("Error placing hold:", err);
        alert("Failed to place hold");
      }
    });
  });

  // Remove Hold button: update user status to "free".
  document.querySelectorAll(".release-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const username = button.getAttribute("data-username");
      try {
        const response = await fetch("/protected/admin/release", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await response.json();
        alert(data.msg);
        window.location.reload();
      } catch (err) {
        console.error("Error releasing hold:", err);
        alert("Failed to release hold");
      }
    });
  });

  // Delete button: unpin all pins with user's cidname and delete their account.
  document.querySelectorAll(".delete-user-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const username = button.getAttribute("data-username");
      if (
        !confirm(
          `Are you sure you want to delete user "${username}"? This action cannot be undone.`
        )
      ) {
        return;
      }
      try {
        const response = await fetch("/protected/admin/deleteUser", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await response.json();
        alert(data.msg);
        window.location.reload();
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user");
      }
    });
  });
});
