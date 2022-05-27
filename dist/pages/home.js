import * as http from "./http";

// get all channels
let channels = http.get("/channels");

console.log(channels);

// // get all channels
// const loginForm = document.getElementById("loginForm");

// // define submiteForm function that submits data as JSON
// async function submitForm(event, form) {
//   // prevent reloadling the page
//   event.preventDefault();

//   // prevent user interaction to prevent double submissions
//   const btn = document.getElementById("loginButton");
//   btn.disabled = true;
//   setTimeout(() => (btn.disabled = false), 2000);

//   // build JSON body
//   const json = buildJson(form);

//   // build headers
//   const headers = buildHeaders();

//   // send request
//   const response = await post(form.action, headers, json);
//   console.log(response);
// }

// // submit data as JSON
// loginForm.addEventListener("submit", (e) => {
//   submitForm(e, loginForm);
// });
