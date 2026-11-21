// getRandomValues also works when a phone opens a local event over HTTP.
export function clientKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
}
