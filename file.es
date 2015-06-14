"use strict";
var socket = new WebSocket("ws://localhost:8080/")
  , own_ID = ""
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
function HTMLescape(text) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(text)); // I do so love black-boxes
  return div.innerHTML;
};
function append_line(text) {
  li = document.createElement("li");
  li.innerHTML = HTMLescape(text);
  ul.appendChild(li);
};
function string2buffer(string) {
  var index = 0
    , length = string.length
    , buffer = new ArrayBuffer(length)
    , view = new DataView(buffer)
  ;
  while (index !== length) {
    view.setUint8(index, string.charCodeAt(index));
    index = index +1;
  }
  return buffer;
};
function buffer2string(buffer) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
};
function concat_buffers(buffer1, buffer2) {
  var array = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    array.set(new Uint8Array(buffer1), 0);
    array.set(new Uint8Array(buffer2), buffer1.byteLength);
  return array.buffer;
}; 
// setting up
form.addEventListener("submit", function form_onsubmit(event) {
  event.preventDefault();
  if (socket.readyState !== socket.OPEN) {
    return;
  }
  socket.send(string2buffer("\x00"+ unescape(encodeURIComponent(input.value)) ));
  input.value = "";
});

socket.binaryType = "arraybuffer";
socket.addEventListener("close", function socket_onclose(close) {
  console.log("socket_onclose", close);
});
socket.addEventListener("error", function socket_onerror(error) {
  console.log("socket_onerror", error);
});
socket.addEventListener("open", function socket_onopen(open) {
  console.log("socket_onopen", open);
});
socket.addEventListener("message", function socket_onmessage(message) {
  var view;
  if (message.data.constructor === String) {
    socket.close();
  } else {
    view = DataView(message.data);
    switch (view.getUint8(0)) {
      case 0x80:
        break;
      case 0x81:
        append_line(buffer2string(message.data).substring(1));
        break;
    }
  }
});
update_input_state();