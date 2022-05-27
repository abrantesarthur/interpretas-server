// TODO: define target form action dynamically
let _baseURI = "http://localhost:3000";

async function _fetch(method, path, body, headers) {
  if (!uri || !headers || !body) {
    throw new Error("One or more post() parameters was not passed");
  }
  try {
    const rawResponse = await fetch(baseURI + path, {
      method: method,
      headers: headers,
      body: JSON.stringify(body),
    });
    if (rawResponse.ok) {
      return await rawResponse.json();
    }
  } catch (e) {
    console.error(`Error at POST request: ${e}`);
    throw e;
  }
}

async function post(path, body, headers = buildHeaders()) {
  _fetch("POST", path, body, headers);
}

async function get(path, body = {}, headers = buildHeaders()) {
  _fetch("GET", path, body, headers);
}

function buildHeaders() {
  headers = {};
  headers["Content-Type"] = "application/json";
  return headers;
}

async function parseResponse(response) {
  if (response.ok) {
    return await response.json();
  } else {
    return JSON.stringify({
      status: response.status,
    });
  }
}

export { get, post, buildHeaders, parseResponse };
