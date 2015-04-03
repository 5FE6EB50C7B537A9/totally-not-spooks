var socket = new WebSocket("ws://ws.spooks.me/socket.io/?transport=websocket")
  , location_search = location.search, location_hash = location.hash
  , channel = "/this.spooks.me/", channel_l = channel.length
  , session = "", lastTimeout = 0, active = 0, unread = 0, flair = ""
  , online_meow = [], online_code = [], online_nick = [], online_l = 0
  , can_log_frames = /chrome/i.test(navigator.userAgent), update = {}
  
  , form = document.body.lastElementChild
  , input = form.firstElementChild
  , div = document.body.firstElementChild
  , ul = div.firstElementChild
  , li = document.createElement("li")
  , red = document.createElement("li")
  
  , num0 = 0, num1 = 0, num2 = 0, num3 = 0, arr0 = [], arr1 = [], str0 = "", str1 = "", obj0 = {}
  
  , fromserver = {
      "###":function() { debugger; }
    , "message":message_message
    , "centermsg":message_center
    , "online":function(arr) { arr.forEach(fromserver_join); }
    , "join":fromserver_join
    , "nick":fromserver_nick
    , "left":fromserver_left
    , "refresh":fromserver_refresh
    , "general-message":fromserver_general
    , "error-message":fromserver_error
    , "update":fromserver_update
  }
  , commands = {
        "###"              :[0, 2, command_error]
      , "/clear"           :[0, 2, command_clear]
      , "/kill"            :[0, 2, function() { socket.close(); }]
      , "/list"            :[0, 2, command_list]
      , "/unregister"      :[0, 0]
      , "/whoami"          :[0, 0]
      , "/anon"            :[1, 0, "message"]
      , "/elbot"           :[1, 0, "message"]
      , "/echo"            :[1, 3, "text", command_echo]
      , "/help"            :[1, 3, "command", command_help]
      , "/mask"            :[1, 0, "vHost"]
      , "/me"              :[1, 0, "message"]
      , "/msg"             :[1, 0, "message"]
      , "/nick"            :[1, 0, "nick"]
      , "/part"            :[1, 0, "message"]
      , "/speak"           :[1, 0, "message"]
      , "/verify"          :[1, 0, "reenter_password"]
      , "/whois"           :[1, 0, "nick"]
      , "/change_password" :[2, 0, "old_password", "new_password"]
      , "/login"           :[2, 0, "nick", "password"]
      , "/pm"              :[2, 0, "nick", "message"]
      , "/register"        :[2, 0, "email_address", "initial_password"]
  };
function HTMLescape(text) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(text)); // I do so love black-boxes
  return div.innerHTML;
}
function new_message() {
  if (active == 1) {
    red.removeAttribute("id");
    red = ul.lastChild;
    red.setAttribute("id", "red");
    active = 2;
  }
  if (active == 2) {
    unread++;
    document.title = '(' + unread + ') Spooks';
  }
}
function createLine(HTML) {
  li = document.createElement("li");
  li.innerHTML = HTML;
  ul.appendChild(li);
  li.scrollIntoView(false);
}
function id_nick(id) {
  num0 = online_code.indexOf(id);
  return HTMLescape((num0 == -1)
    ? ("\xAB" + id + "\xBB")
    : (online_nick[num0]));
}
function nick_color(nick) {
  num0 = online_nick.indexOf(nick);
  return (num0 == -1)
    ? ('<samp class="bad_nick">' + HTMLescape(nick) + '</samp>')
    : ('<span style=' + online_meow[num0] + '>' + HTMLescape(nick) + '</span>');
}
// message = any thing that is a message you get from the server
function message_message(message) {
  new_message();
  switch(message.type) {
    case "action-message":
      message_action(message);
      break;
    case "anon-message":
      message_anon(message);
      break;
    case "chat-message":
      message_chat(message);
      break;
    case "error-message":
      message_error(message);
      break;
    case "general-message":
      message_general(message);
      break;
    case "personal-message":
      message_personal(message);
      break;
    case "spoken-message":
      message_spoken(message);
      break;
    default:
      console.log(message);
      break;
  }
}
function message_action(message) {
  createLine(HTMLescape(message.message));
}
function message_anon(message) {
  createLine(nick_color(message.name) + HTMLescape(" = " + message.message));
}
function message_center(message) { // server inconsistencies
  new_message();
  li = document.createElement("li");
  li.innerHTML = HTMLescape(message.msg);
  li.classList.add("centermsg"); // can't use createLine
  ul.appendChild(li);
  li.scrollIntoView(false);
}
function message_chat(message) {
  li = document.createElement("li");
  li.innerHTML = nick_color(message.nick) + HTMLescape(" : " + message.message);
  li.setAttribute("meta-hat", message.hat); // can't use createLine
  li.setAttribute("meta-count", message.count);
  ul.appendChild(li);
  li.scrollIntoView(false);
}
function message_error(message) {
  createLine('ERROR: ' + HTMLescape(message.message));
}
function message_general(message) {
  createLine('GENERAL: ' + HTMLescape(message.message));
}
function message_personal(message) {
  str0  = "{";
  str0 += id_nick(message.from);
  str0 += " ==> ";
  str0 += id_nick(message.to);
  str0 += "}: ";
  str0 += message.message;
  createLine(HTMLescape(str0));
}
function message_spoken(message) {
  li = document.createElement("li");
  li.innerHTML = nick_color(message.nick) + HTMLescape(" : " + message.message);
  li.setAttribute("meta-voice", message.voice); // can't use createLine
  ul.appendChild(li);
  li.scrollIntoView(false);
}
// fromserver = not-message things the server send
function fromserver_join(obj) {
  str0 = 'background:#';
  num0 = 0;
  for (num1 = 0, num2 = obj.id.length; num1 != num2; num1 ++) {
    num0 = (num0 << 5) - num0 + obj.id.charCodeAt(num1++);
  }
  num0 >>>= 8; num1 = num0 & 255; str0 = str0 + (num0 + 0x1000000).toString(16).slice(1);
  num0 >>>= 8; num2 = num0 & 255;
  num0 >>>= 8; num3 = num0 & 255;
  str0 = str0 + ';color:' + (Math.max(num1, num2, num3) + Math.min(num1, num2, num3) > 256 ? 'black' : 'white');
  
  online_nick.push(obj.nick);
  online_code.push(obj.id);
  online_meow.push(str0);
  online_l++;
  
  li = document.createElement("li");
  li.innerHTML = '<samp>[' + HTMLescape(obj.id) + ']</samp>' + HTMLescape(obj.nick) + ' join';
  li.classList.add("join"); // can't use createLine
  ul.appendChild(li);
  li.scrollIntoView(false);
}
function fromserver_nick(obj) {
  num0 = online_code.indexOf(obj.id);
  if (num0 == -1) {
    debugger;
    return message_action({"message":"fromserver_nick"});
  }
  str0 = online_nick[num0];
  
  online_nick[num0] = obj.nick;
  
  li = document.createElement("li");
  li.innerHTML = '<samp>[' + obj.id + ']</samp>' + HTMLescape(str0) + ' is now known as ' + HTMLescape(obj.nick);
  li.classList.add("nick"); // can't use createLine
  ul.appendChild(li);
  li.scrollIntoView(false);
}
function fromserver_left(obj) {
  num0 = online_code.indexOf(obj.id);
  if (num0 == -1) {
    debugger;
    return message_action({"message":"fromserver_left"});
  }
  
  online_meow.splice(num0, 1);
  online_code.splice(num0, 1);
  online_nick.splice(num0, 1);
  online_l--;
  
  li = document.createElement("li");
  li.innerHTML = '<samp>[' + HTMLescape(obj.id) + ']</samp>' + HTMLescape(obj.nick) + ' left';
  li.classList.add("left"); // can't use createLine
  ul.appendChild(li);
  li.scrollIntoView(false);
}
function fromserver_refresh() {
  createLine('You might want to refresh ...');
}
function fromserver_error(obj) { // server inconsistencies
  new_message();
  message_error({"message":obj});
}
function fromserver_general(obj) { // server inconsistencies
  new_message();
  message_general({"message":obj});
}
function fromserver_update(obj) {
  for (str0 in obj) {
    switch(str0) {
      case "access":
      case "access_level":
      case "background":
      case "chat_style":
      case "frame_src":
      case "id":
      case "nick":
      case "notification":
      case "part":
      case "password":
      case "role":
      case "theme":
      case "vHost":
        update[str0] = obj[str0];
        break;
      case "topic":
        createLine('TOPIC: ' + HTMLescape(obj[str0]));
        break;
      default:
        console.log("%s: %s", str0, obj[str0]);
        break;
    }
  }
}
// command = command scpecial handlers
function command_error() {
  createLine('command_error: unknown command');
}
function command_clear() {
  div.removeChild(ul);
  ul = div.appendChild(document.createElement("ul"));
}
function command_echo(data) {
  createLine(HTMLescape(data.text));
}
function command_list() {
  for (num0 = 0;num0 != online_l;num0++) {
    createLine('<samp>' + HTMLescape(online_code[num0]) + '</samp> ' + HTMLescape(online_nick[num0]));
  }
}
function command_help(command) {
  if (typeof command == "undefinied") {
    createLine('command_help: not yet');
  } else {
    createLine('command_help: not yet (' + HTMLescape(command) + ')');
  }
}
// socket = event handlers for the websocket
function socket_close(event) {
  console.log("close %O", event);
  if (event.code != "1000") {
    socket_setup(true);
  }
}
function socket_error(event) {
  console.log("error %O", event);
}
function socket_open(event) {
  console.log("open  %O", event);
}
function socket_message(event) {
  if (!can_log_frames) {
    console.log(event.data); // not chrome suck for this alone
  }
  switch(event.data.match(/^\d\d?/)[0]) {
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
  }
}
function socket_message_0(data) {
  session = data.match(/"sid":"([\w-]+)"/)[1];
  if (channel_l != 0) {
    socket.send("40" + channel);
  }
  if (/[?&]flair=[^&]/.test(location_search)) {
    flair = decodeURIComponent(location_search.match(/[?&]flair=(.*?)(&|$)/)[1]);
  } else {
    flair = session; // why not
  }
}
function socket_message_3() {
  lastTimeout = setTimeout(function() {
    clearTimeout(lastTimeout);
    socket.send("2");
  }, 25000); // hardcoding the setting
}
function socket_message_40(data) {
  if (channel_l != 0) {
    if (data.slice(2, 2 + channel_l) != channel) {
      return;
    }
    channel += ",";
    channel_l++;
  }
  if (location_hash == "#silent") {
    return; // because you can, obviously
  }
  if (/[?&](nick|(user)?name)=[^&]/.test(location_search) && /[?&]pass(word)?=[^&]/.test(location_search)) {
    str0 = unescape(decodeURIComponent(location_search.match(/[?&](nick|(user)?name)=(.*?)(&|$)/)[3])); // nick / username / name
    str1 = unescape(decodeURIComponent(location_search.match(/[?&]pass(word)?=(.*?)(&|$)/)[2])); // pass / password
    socket.send("42" + channel + JSON.stringify(["join", {"nick":str0, "password":str1}]));
  } else {
    socket.send("42" + channel + JSON.stringify(["join", {"nick":null, "password":null}]));
  }
  if (/[?&]part=[^&]/.test(location_search)) {
    str0 = decodeURIComponent(location_search.match(/[?&]part=(.*?)(&|$)/)[1]); // part
  } else {
    str0 = "https://github.com/5FE6EB50C7B537A9/totally-not-spooks";
  }
  socket.send("42" + channel + JSON.stringify(["command", {"name":"part", "params":{"message":str0}}]));
}
function socket_message_41() {
  socket_setup(true);
}
function socket_message_42(data) {
  if (channel_l != 0) {
    if (data.slice(2, channel_l + 2) != channel) {
      return;
    }
    arr0 = JSON.parse(data.slice(2 + channel_l));
  } else {
    arr0 = JSON.parse(data.slice(2));
  }
  (fromserver[arr0[0]] || fromserver["###"])(arr0[1]);
}
function socket_setup(hard) {
  if (hard) {
    if (channel.charAt(channel_l - 1) == ",") {
      channel = channel.slice(0, -1);
      channel_l--;
    }
    socket.close();
    socket = new WebSocket("ws://ws.spooks.me/socket.io/?transport=websocket");
  }
  if (lastTimeout != 0) {
    clearTimeout(lastTimeout);
  }
  socket.addEventListener("close", socket_close);
  socket.addEventListener("error", socket_error);
  socket.addEventListener("open", socket_open);
  socket.addEventListener("message", socket_message);
}
// setting up
window.addEventListener("mousemove", function() {
  if (active != 0) {
    active = 0;
    document.title = "Spooks";
  }
});
window.addEventListener("blur", function() {
  active = !!ul.lastChild ? 1 : 2;
  unread = 0;
});
form.addEventListener("submit", function(event) {
  event.preventDefault();
  if (socket.readyState != socket.OPEN) {
    return;
  }
  str0 = unescape(encodeURIComponent(input.value)); // I have no clue why this (still) is needed ...
  if (str0.charAt(0) == "/" && /^\/\w\w+/.test(str0)) {
    obj0 = {};
    str1 = str0.match(/^\/\w\w+/)[0];
    arr0 = commands[str1] || commands["###"];
    num0 = arr0[0];
    switch(num0) {
      case 1:
        arr1 = str0.match(/^\/\w+.(.*)$/);
        obj0[arr0[2]] = arr1[1];
        break;
      case 2:
        arr1 = str0.match(/^\/.+ (.*?) (\w*)$/); // later I guess
        obj0[arr0[2]] = arr1[1];
        obj0[arr0[3]] = arr1[2];
        break;
    }
    if (arr0[1] == 0) {
      socket.send("42" + channel + JSON.stringify(["command", {"name":str1.slice(1), "params":obj0}]));
    } else {
      arr0[arr0[1]](obj0);
    }
  } else { // basic message
    socket.send("42" + channel + JSON.stringify(["message", {"flair":flair, "message":str0}]));
  }
  input.value = "";
});
(function updateInputState() {
  if (socket.readyState == WebSocket.OPEN) {
    input.setAttribute("placeholder", "Press enter to submit.");
    input.removeAttribute("disabled");
  } else {
    requestAnimationFrame(updateInputState);
  }
})();
socket_setup(false);
