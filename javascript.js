var socket = new WebSocket("ws://ws.spooks.me/socket.io/?transport=websocket")
  , location_search = location.search, location_hash = location.hash
  , channel = "/this.spooks.me/", channel_l = channel.length
  , session = "", lastTimeout = 0, active = 0, unread = 0, flair = ""
  , online_meow = [], online_code = [], online_nick = [], online_l = 0
  // DOM elements
  , form = document.body.lastElementChild
  , input = form.firstElementChild
  , ul = document.body.firstElementChild.firstElementChild
  , li = document.createElement("li")
  , red = document.createElement("li")
  // public (typed) items
  , num0 = 0, num1 = 0, num2 = 0, num3 = 0, arr0 = [], arr1 = [], str0 = "", str1 = "", obj0 = {}
  // settings, sortof
  , fromserver = {
      "###": function(){console.log(arr0)},
      "message": message_message,
      "error-message": message_error,
      "centermsg": message_center,
      "online": function(arr){arr.forEach(fromserver_join)},
      "join": fromserver_join,
      "nick": fromserver_nick,
      "left": fromserver_left,
      "refresh": fromserver_refresh
  }
  , commands = {
      "command_error":    [0, 1, command_error],
      "/clear":           [0, 1, command_clear],
      "/kill":            [0, 1, function(){socket.close()}],
      "/list":            [0, 1, command_list],
      "/unregister":      [0, 0],
      "/whoami":          [0, 0],
      "/anon":            [1, 0, "message"],
      "/elbot":           [1, 0, "message"],
      "/help":            [1, 1, command_help, "command"],
      "/mask":            [1, 0, "vHost"],
      "/me":              [1, 0, "message"],
      "/msg":             [1, 0, "message"],
      "/nick":            [1, 0, "nick"],
      "/part":            [1, 0, "message"],
      "/speak":           [1, 0, "message"],
      "/verify":          [1, 0, "reenter_password"],
      "/whois":           [1, 0, "nick"],
      "/change_password": [2, 0, "old_password", "new_password"],
      "/login":           [2, 0, "nick", "password"],
      "/pm":              [2, 0, "nick", "message"],
      "/register":        [2, 0, "email_address", "initial_password"]
  }
;

function HTMLescape(text) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(text)); // I do so love black-boxes
  return div.innerHTML;
};
function createLine(HTML) {
  if (active == 1) {
    red.removeAttribute("id");
    red = ul.lastChild;
    red.setAttribute("id", "red");
    active = 2;
  };
  li = document.createElement("li");
  li.innerHTML = HTML;
  ul.appendChild(li);
  li.scrollIntoView(false);
};
function nickColor(nick) { // num0, str0
  num0 = online_nick.indexOf(nick);
  if (num0 == -1) str0 = 'color:purple'; // something weird is going on ...
  else str0 = online_meow[num0];
  return '<span style='+str0+'>'+HTMLescape(nick)+'</span>';
};
function updateInputState() {
  if (socket.readyState == WebSocket.OPEN) {
    input.setAttribute("placeholder", "Press enter to submit.");
    input.removeAttribute("disabled");
  } else {
    requestAnimationFrame(updateInputState);
  }
};
// message = any thing that is a message you get from the server
function message_message(obj) {
  newMessage(obj);
};
function message_error(obj) {
  createLine("ERROR: "+HTMLescape(message.message, 1));
};
function message_center(obj) {
  li = document.createElement("li");
  li.innerHTML = HTMLescape(obj.msg);
  li.classList.add("centermsg");
  ul.appendChild(li);
  li.scrollIntoView(false);
};
// fromserver = not-message things the server send
function fromserver_join(obj) { // num0, num1, num2, str0
  str0 = 'background:#';
  num0 = 0; num1 = 0; num2 = obj.id.length;
  while (num1 != num2) num0 = (num0 << 5) - num0 + obj.id.charCodeAt(num1++);
  num0 >>>= 8; num1 = num0 & 0xFF; str0 = str0 + (num0+0x1000000).toString(16).slice(1);
  num0 >>>= 8; num2 = num0 & 0xFF;
  num0 >>>= 8;
  str0 = str0 + ';color:' + (Math.max(num1, num2, num0) + Math.min(num1, num2, num0) > 256 ? "black" : "white");
  
  online_nick.push(obj.nick);
  online_code.push(obj.id);
  online_meow.push(str0);
  online_l ++;
  
  li = document.createElement("li");
  li.innerHTML = '<samp>['+HTMLescape(obj.id)+']</samp>'+HTMLescape(obj.nick)+' join';
  li.classList.add("join");
  ul.appendChild(li);
  li.scrollIntoView(false);
};
function fromserver_nick(obj) { // num0, str0
  console.log("nick", obj);
  num0 = online_code.indexOf(obj.id);
  if (num0 == -1) return "what the what";
  str0 = online_nick[num0];
  online_nick[num0] = obj.nick;
  
  li = document.createElement("li");
  li.innerHTML = '<samp>['+obj.id+']</samp>'+HTMLescape(str0)+' is now known as '+HTMLescape(obj.nick);
  li.classList.add("nick");
  ul.appendChild(li);
  li.scrollIntoView(false);
};
function fromserver_left(obj) { // num0
  console.log("left", obj);
  num0 = online_code.indexOf(obj.id);
  if (num0 == -1) return "ERROR";
  
  online_meow.splice(num0, 1);
  online_code.splice(num0, 1);
  online_nick.splice(num0, 1);
  online_l --;
  
  li = document.createElement("li");
  li.innerHTML = '<samp>['+HTMLescape(obj.id)+']</samp>'+HTMLescape(obj.nick)+' left';
  li.classList.add("left");
  ul.appendChild(li);
  li.scrollIntoView(false);
};
function fromserver_refresh() {
  li = document.createElement("li");
  li.innerHTML = HTMLescape("You might want to refresh ...");
  li.classList.add("left");
  ul.appendChild(li);
  li.scrollIntoView(false);
};
function newMessage(message) {
  switch (message.type||"action-message") {
    case "action-message":
      createLine(HTMLescape(message.message))
      break;
    case "chat-message":
      createLine(nickColor(message.nick)+" : "+HTMLescape(message.message, 1));
      li.setAttribute("meta-hat", message.hat);
      li.setAttribute("meta-count", message.count);
      if (message.count == 999) location.reload();
      break;
    case "error-message":
      createLine("ERROR: "+HTMLescape(message.message, 1))
      break;
    case "anon-message": // actually not anonymous, at all
      createLine(nickColor(message.name)+" : "+HTMLescape(message.message, 0))
      break;
    case "spoken-message":
      createLine(nickColor(message.nick)+" : "+HTMLescape(message.message, 0))
      break;
    case "personal-message":
      if (message.from == session) { // sent back from the server
        num0 = online_code.indexOf(message.to);
        if (num0 == -1) break;
        createLine(HTMLescape(online_nick[num0])+'&lt;=='+HTMLescape(message.message, 0))
      } else { // you got mail
        createLine(HTMLescape(message.nick)+'==&gt;'+HTMLescape(message.message, 0))
      }
      break;
    default:
      console.log(message);
      break;
  };
  if (active == 2) {
    unread ++;
    document.title = unread.toString(10)+" unread messages";
  };
};
// command = command scpecial handlers
function command_error() {
  createLine("command_error: unknown command");
};
function command_clear() {
  createLine("command_clear: not yet");
};
function command_list() {
  for (num0 = 0; num0 != online_l; num0++) {
    createLine('<samp>'+online_code[num0]+'</samp>'+HTMLescape(online_nick[num0]))
  };
};
function command_help(command) {
  if (typeof command == "undefinied") {
    createLine("command_help: not yet");
  } else {
    createLine("command_help: not yet ("+command+")");
  }
};
// socket = event handlers for the websocket
function socket_close(event) {
  console.log("close %O", event);
  socket_setup(true);
};
function socket_error(event) {
  console.log("error %O", event)
};
function socket_open(event) {
  console.log("open  %O", event)
};
function socket_message(event) {
  switch (event.data.match(/^\d\d?/)[0]) {
    case "0":
      socket_message_0(event.data);
      // fallthrough
    case "3":
      socket_message_3();
      break;
    case "40":
      socket_message_40(event.data);
      break;
    case "41":
      socket_message_41();
      break;
    case "42":
      socket_message_42(event.data);
      break;
    default:
      console.log(event);
    break;
  };
};
function socket_message_0(data) {
  session = data.match(/"sid":"([\w-]+)"/)[1];
  socket.send("40"+ channel);
  if (/[?&]flair=[^&]/.test(location_search)) {
    flair = decodeURIComponent(location_search.match(/[?&]flair=(.*?)(&|$)/)[1]);
  } else {
    flair = session; // why not
  };
};
function socket_message_3() {
  lastTimeout = setTimeout(function(){
    clearTimeout(lastTimeout);
    socket.send("2");
  }, 25000); // hardcoding the setting
};
function socket_message_40(data) {
  if (data.slice(2,2+channel_l) == channel) {
    if (channel_l != 0) { channel += ","; channel_l++ };
    if (location_hash == "#silent") return; // because you can, obviously
    if (/[?&](nick|(user)?name)=[^&]/.test(location_search) && /[?&]pass(word)?=[^&]/.test(location_search)) {
      str0 = unescape(decodeURIComponent(location_search.match(/[?&](nick|(user)?name)=(.*?)(&|$)/)[3])); // nick / username / name
      str1 = unescape(decodeURIComponent(location_search.match(/[?&]pass(word)?=(.*?)(&|$)/)[2])); // pass / password
      socket.send("42"+channel+JSON.stringify(["join",{"nick":str0,"password":str1}]));
    } else {
      socket.send("42"+channel+JSON.stringify(["join",{"nick":null,"password":null}]));
    }
    if (/[?&]part=[^&]/.test(location_search)) {
      str0 = decodeURIComponent(location_search.match(/[?&]part=(.*?)(&|$)/)[1]) // part
    } else {
      str0 = "https://github.com/5FE6EB50C7B537A9/totally-not-spooks";
      str0 = "https://dl.dropboxusercontent.com/s/v8tu27dgv9tae7u/spooks.png";
    }
    socket.send("42"+channel+JSON.stringify(["command",{"name":"part","params":{
      "message": str0
    }}]))
  }
};
function socket_message_41() {
  socket_setup(true);
};
function socket_message_42(data) {
  if (data.slice(2, channel_l +2) == channel) {
    arr0 = JSON.parse(data.slice(2+channel_l));
    (fromserver[arr0[0]]||fromserver["###"])(arr0[1]);
  }
};
function socket_setup(hard) {
  if (hard) {
    if (channel.charAt(channel_l-1) == ",") {
      channel = channel.slice(0, -1);
      channel_l --;
    }
    socket.close();
    socket = new WebSocket("ws://ws.spooks.me/socket.io/?transport=websocket");
  }
  if (lastTimeout != 0) clearTimeout(lastTimeout);
  socket.addEventListener("close", socket_close);
  socket.addEventListener("error", socket_error);
  socket.addEventListener("open", socket_open);
  socket.addEventListener("message", socket_message);
};
// setting up
window.addEventListener("focus", function() { active = 0; document.title = "Spooks" });
window.addEventListener("blur" , function() { if (ul.lastChild) active = 1; unread = 0 });
form.addEventListener("submit", function(event) { // num0, arr0, arr1, str0, str1, obj0; commands
  event.preventDefault();
  str0 = input.value;
  if (str0.charAt(0) == "/" && /^\/\w\w+/.test(str0)) {
    obj0 = {};
    str1 = str0.match(/^\/\w\w+/)[0];
    arr0 = commands[str1]||commands["command_error"];
    num0 = arr0[0];
    // get parameters
    switch (num0) {
      case 1:
        arr1 = str0.match(/^\/\w+.(.*)$/);
        obj0[arr0[2]] = arr1[1];
        break;
      case 2:
        arr1 = str0.match(/^\/.+ (.*?) (\w*)$/); // later I guess
        obj0[arr0[2]] = arr1[1];
        obj0[arr0[3]] = arr1[2];
        break;
    };
    // send the data
    if (arr0[1] == 0) {
      socket.send("42"+channel+JSON.stringify(["command",{"name":str1.slice(1),"params":obj0}]));
    } else {
      if (num0 == 1)
        arr0[2](str0);
      else
        arr0[2]();
    };
  } else { // basic message
    socket.send("42"+channel+JSON.stringify(["message",{"flair":flair, "message":/*"$Homenaje|"+ */str0}]));
  };
  input.value = "";
});
updateInputState();
socket_setup(false);
