import { getOpenPorts, getQueries, getTimer, setTimer } from "../../vars.js";

export function logLargeObjects() {
  let queriesLen = Object.keys(getQueries()).length;
  let portsLen = Object.keys(getOpenPorts()).length;
  if (queriesLen > 500) {
    console.error("queries appears to be leaking:", queriesLen);
  }
  if (portsLen > 50) {
    console.error("ports appears to be leaking:", portsLen);
  }
  setTimer(getTimer() * 1.25);
  setTimeout(logLargeObjects, getTimer());
}
