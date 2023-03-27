// "fills in the blanks" in popup.html with the values from storage
async function fillBlanks() {
  let lastUpdated = await chrome.storage.sync.get({ last_update: "" });
  let statusObj = await chrome.storage.sync.get({ status: "operational" });
  document.getElementById("lastUpdate").innerText =
    "Last update: " + lastUpdated.last_update;

  let status = statusObj.status;
  let title = document.getElementById("title");
  if (status == "partial_outage") {
    title.innerText = "ChatGPT is partially down. It might not work.";
    title.style.color = "var(--yellow)";
  } else if (status == "major_outage") {
    title.innerText = "ChatGPT is currently experiencing a major outage.";
    title.style.color = "var(--red)";
  } else {
    title.innerText = "Chat GPT is fully operational.";
    title.style.color = "var(--green)";
  }

  let others = await chrome.storage.sync.get({ othersDown: false });
  let otherStatus = document.getElementById("otherStatus");
  if (others.othersDown) {
    otherStatus.innerText = `Other OpenAI services are down ${
      status == "operational" ? "though." : "too."
    }`;
  } else if (status != "operational") {
    otherStatus.innerText = "Other OpenAI services are functioning normally.";
  } else {
    otherStatus.innerText = "All OpenAI services are running.";
  }
}

document.addEventListener("DOMContentLoaded", fillBlanks);

document.getElementById("refreshIcon").addEventListener("click", (e) => {
  chrome.runtime
    .sendMessage({
      refresh: true,
    })
    .then(console.log("success", (error) => console.log(`Error: ${error}`)));
});
