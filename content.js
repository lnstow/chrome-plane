// Logs a simple message once the content script runs on each page load.
console.log(document.querySelector("a")?.innerText || "No link found");

