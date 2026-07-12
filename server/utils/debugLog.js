const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "../../debug-c153b2.log");

function debugLog(location, message, data = {}, hypothesisId = "") {
  const entry = {
    sessionId: "c153b2",
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  try {
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);
  } catch { /* ignore */ }
}

module.exports = { debugLog };
