document.addEventListener("DOMContentLoaded", () => {
  // Refresh every 14 minutes (840000 ms) – adjust as needed
  const REFRESH_INTERVAL = 840000;

  async function refreshToken() {
    try {
      const response = await fetch("/refresh-token", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        // console.log("Token refreshed automatically:", data.token);
        // No need to update the token manually; the httpOnly cookie is updated by the server.
      } else {
        // console.error("Failed to refresh token");
      }
    } catch (err) {
      // console.error("Error refreshing token:", err);
    }
  }

  // If the page is visible, perform a refresh now and then periodically
  function scheduleRefresh() {
    if (document.visibilityState === "visible") {
      refreshToken();
    }
  }

  // initial refresh on load
  if (document.visibilityState === "visible") {
    refreshToken();
  }

  // Set up an interval to periodically refresh the token
  setInterval(scheduleRefresh, REFRESH_INTERVAL);

  // Also trigger a refresh when the page becomes visible again
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshToken();
    }
  });
});
