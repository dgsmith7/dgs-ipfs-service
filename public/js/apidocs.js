document.addEventListener("DOMContentLoaded", () => {
  // event listeners for copy buttons
  let lenStr = document.querySelector("#content-length").textContent;
  let contentLength = parseInt(lenStr);

  for (let i = 0; i < contentLength; i++) {
    const button = document.getElementById(`copy-code-button-${i}`);
    if (button) {
      button.addEventListener("click", async () => {
        let s = "#code-snippet-" + i;
        let code = [document.querySelector(s).textContent];
        await navigator.clipboard.writeText(code);
      });
    }
  }
});
