
function objectToCookieString(cookieObject) {
  return Object.entries(cookieObject)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('; ');
}
function parseCookieString(cookieString) {
  const parsedObject = {};
  const pairs = cookieString.split('; ');

  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    parsedObject[key] = decodeURIComponent(value || '');
  });

  return parsedObject;
}
function objectToQueryString(obj) {
  const keyValuePairs = [];
  for (const key in obj) { if (obj.hasOwnProperty(key)) { keyValuePairs.push(`${key}=${obj[key]}`); } }
  return keyValuePairs.join('&');
}
async function SessionLocate({ objectID, profileID, lang, type }, cookie) {
  let res = await fetch(`https://www.kogama.com/locator/session/?${objectToQueryString({ objectID, profileID, lang, type, referrer: "kogama" })}`, {
    headers: {
      accept: "application/json",
      cookie: objectToCookieString(cookie),
    },
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) return false;
  return await res.json()
}
async function PrivateSessionLocate(config, cookie) {
  let res = await fetch("https://www.kogama.com/locator/session/private/", {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: objectToCookieString(cookie),
    },
    body: JSON.stringify(config),
    method: "POST",
    credentials: "include"
  })
  if (!res.ok) return false;
  return await res.json()
}

module.exports = { SessionLocate, objectToCookieString, parseCookieString, objectToQueryString, PrivateSessionLocate }