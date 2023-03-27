document.getElementById("saveButton").addEventListener("click", (e) => {
  const refreshRate = document.getElementById("refreshRate").value * 60000;
  chrome.storage.sync.set({ refreshRate: refreshRate });
  console.log(refreshRate);
  chrome.runtime
    .sendMessage({
      update: true,
    })
    .then(console.log("success", (error) => console.log(`Error: ${error}`)));
  e.preventDefault();
});

function restoreOptions() {
  let storedRate = chrome.storage.sync.get("refreshRate");
  storedRate.then((res) => {
    document.getElementById("refreshRate").value = res.refreshRate / 60000 || 1;
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
