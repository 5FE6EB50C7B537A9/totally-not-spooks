var socket = new WebSocket("ws://localhost:8080/")
  // DOM elements
  , form = document.body.lastElementChild
  , input = form.firstElementChild
  , div = document.body.firstElementChild
  , ul = div.firstElementChild
  , li = document.createElement("li")
;
function update_input_state() {
  if (socket.readyState == WebSocket.OPEN) {
    input.setAttribute("placeholder", "Press enter to submit.");
    input.removeAttribute("disabled");
  } else {
    requestAnimationFrame(update_input_state);
  }
};
// setting up
form.addEventListener("submit", function form_onsubmit(event) {
  event.preventDefault();
  if (socket.readyState != socket.OPEN) {
    return;
  }
  socket.send(input.value);
  input.value = "";
});
socket.addEventListener("close", function socket_onclose() {
  console.log(arguments.callee.name, arguments);
});
socket.addEventListener("error", function socket_onerror() {
  console.log(arguments.callee.name, arguments);
});
socket.addEventListener("open", function socket_onopen() {
  console.log(arguments.callee.name, arguments);
});
socket.addEventListener("message", function socket_onmessage() {
  console.log(arguments.callee.name, arguments);
});
update_input_state();