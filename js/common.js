// This is the main js file for the extension.
let lastStatus;
let lastTime;

let refreshDelay = 60000;

let statusMessage;
let timeMessage;

let mainLoop;

// updates the status of chatGPT via the api
async function updateStatus() {
  console.log("updating status");
  try {
    const response = await fetch(
      "https://status.openai.com/api/v2/summary.json"
    );
    let othersDown = false;
    const data = await response.json();
    data.components.forEach((e, index) => {
      if (e.status != "operational" && index != 1) {
        othersDown = true;
      }
    });
    const { status, updated_at: time } = data.components[1];
    chrome.storage.sync.set({
      last_update: formatDate(time),
      status,
      othersDown,
    });

    return { status, time };
  } catch (err) {
    console.log("Error: " + err);
    return { status: undefined, time: undefined };
  }
}

// initializes stored variables and starts main function
async function init() {
  try {
    console.log("init started");
    refreshDelay = await chrome.storage.sync.get({ refreshRate: 60000 });
    console.log(refreshDelay);

    // Start the interval to call the main function
    console.log(
      `will refresh every ${refreshDelay.refreshRate / 60000} minutes`
    );
    mainLoop = setInterval(main, refreshDelay.refreshRate);
    main(); // Call the main function immediately
  } catch (err) {
    console.log("Error: " + err);
    main();
  }
}

// checks periodically for outages and changes icon accordingly
async function main() {
  let results = await updateStatus();
  lastStatus = results.status;
  lastTime = results.time;
  if (lastStatus == "partial_outage") {
    chrome.action.setIcon({ path: "../icons/128/warning.png" });
  } else if (lastStatus == "major_outage") {
    chrome.action.setIcon({ path: "../icons/128/error.png" });
  } else if (lastStatus == "operational") {
    chrome.action.setIcon({ path: "../icons/128/operational.png" });
  }
  console.log("Main completed. Status is " + lastStatus);
}

// stops the setInterval(), updates refresh rate, and starts it up again.
function updateRate() {
  clearInterval(mainLoop);
  init();
}

// if a chatGPT tab is open, switch to that. Otherwise, open a new chatGPT tab.
function openChatGPT() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    let gptOpen = false;
    tabs.forEach((tab) => {
      if (tab.url.includes("chat.openai.com")) {
        chrome.tabs.update(tab.id, { active: true });
        gptOpen = true;
      }
    });

    if (!gptOpen) {
      chrome.tabs.create({ url: "https://chat.openai.com" });
    }
  });
}

// gets tabs of current window
function getCurrentWindowTabs() {
  return chrome.tabs.query({ currentWindow: true });
}

// checks if chatGPT is the active tab.
// If true: returns true, sets popup to popup.html.
// If false: returns false, sets popup to null.
function isChatGptOpen() {
  console.log("checking if gpt is open");

  getCurrentWindowTabs().then((tabs) => {
    tabs.forEach((tab) => {
      if (tab.active && tab.url.includes("chat.openai.com")) {
        chrome.action.setPopup({ popup: "../html/popup.html" });
        return true;
      } else if (tab.active) {
        chrome.action.setPopup({ popup: "" });
        return false;
      }
    });
  });
}

// decides what to do when the toolbar button is pressed
// depending on if the active tab is chatGPT or not.
function buttonAction() {
  updateStatus();
  console.log("running button action");
  if (isChatGptOpen()) {
    chrome.action.openPopup();
  } else {
    openChatGPT();
  }
}

// converts date from ISO 8601 to a readable format
function formatDate(dateString) {
  const date = new Date(dateString);

  let today = new Date();
  let dayString;
  let timeString;

  console.log(dateString);
  console.log(date);

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    dayString = "Today";
  } else {
    today.setDate(today.getDate() - 1);
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      dayString = "Yesterday";
    } else {
      dayString = date.toLocaleDateString(undefined);
    }
  }

  timeString = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
  });

  return `${dayString} at ${timeString}`;
}

// processes received message
function processMessage(request, sender) {
  if (request.refresh) {
    updateStatus();
  } else {
    updateRate();
  }
}

chrome.action.setPopup({ popup: "" });
chrome.runtime.onStartup.addListener(init);
chrome.action.onClicked.addListener(buttonAction);
chrome.tabs.onActivated.addListener(isChatGptOpen);
chrome.runtime.onMessage.addListener(processMessage);
init();
