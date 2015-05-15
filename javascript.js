var socket = {"close": function(){}}
  , location_search = location.search, channel = ""+location.hash.match(/\/.*/) || "/"
  , channel_ = channel + ",", update = {}, flair = "", suplement = ""
  , sid = "sid", pingInterval, pingTimeout = 0, active = 0, unread = 0
  // DOM elements
  , form = document.body.lastElementChild
  , input = form.firstElementChild
  , div = document.body.firstElementChild
  , ul = div.firstElementChild
  , li = document.createElement("li")
  , red = document.createElement("li")
  // sort of typed variable
  , num0 = 0, num1 = 0, num2 = 0, num3 = 0, arr0 = [], arr1 = [], str0 = "", str1 = "", obj0 = {}

  , fromserver = {
      ""                :function() { debugger; }
    , "centermsg"       :function(obj) { fromserver_message({"type":"center-message","message":obj.msg}); }
    , "join"            :fromserver_join
    , "left"            :fromserver_left
    , "message"         :fromserver_message
    , "nick"            :fromserver_nick
    , "online"          :fromserver_online
    , "refresh"         :function() { createLine('You might want to refresh ...'); }
    , "update"          :fromserver_update
    , "updateCount"     :function() {}
  }
  , commands = {
        ""                 :[-1, 2, command_error]
      , "~clear"           :[0, 3, "Clear chat history."
                            , command_clear]
      , "~kill"            :[0, 3, "Kill the connection."
                            , function() { socket.close() }]
      , "~unregister"      :[0, 0, "Unregister your nick."
                            ]
      , "~whoami"          :[0, 0, ""
                            ]
      , "~anon"            :[1, 0, "Send a message anonymously."
                            , "message"]
      , "~echo"            :[1, 4, "Send a message to yourself."
                            , "text", command_echo]
      , "~elbot"           :[1, 0, "Not usable as of now ..."
                            , "message"]
      , "~help"            :[1, 4, "Show help for commands."
                            , "command", command_help]
      , "~mask"            :[1, 0, ""
                            , "vHost"]
      , "~me"              :[1, 0, ""
                            , "message"]
      , "~msg"             :[1, 0, ""
                            , "message"]
      , "~nick"            :[1, 0, "Change your nick."
                            , "nick"]
      , "~part"            :[1, 0, ""
                            , "message"]
      , "~speak"           :[1, 0, ""
                            , "message"]
      , "~verify"          :[1, 0, ""
                            , "reenter_password"]
      , "~whois"           :[1, 0, ""
                            , "nick"]
      , "~change_password" :[2, 0, "Change your password."
                            , "old_password", "new_password"]
      , "~login"           :[2, 0, ""
                            , "nick", "password"]
      , "~pm"              :[2, 0, "Send a personnal message."
                            , "nick", "message"]
      , "~register"        :[2, 0, ""
                            , "email_address", "initial_password"]
  };
// utility functions
function HTMLescape(text) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(text)); // I do so love black-boxes
  return div.innerHTML;
}
function nick(nick) {
  return '<samp>' + HTMLescape(nick) + '</samp>';
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
  return li;
}
// fromserver = things the server send
function fromserver_join(obj) {
  createLine(nick(obj.nick) + ' join').classList.add("join");
}
function fromserver_left(obj) {
  createLine(nick(obj.nick) + ' left').classList.add("left");
}
function fromserver_nick(obj) {
  createLine(nick(obj.nick) + ' is now the nick of someone').classList.add("nick");
}
function fromserver_online(obj) {
  obj.forEach(fromserver_join);
}
function fromserver_message(message) {
  new_message();
  switch(message.type) {
    case "action-message":
      createLine(HTMLescape(message.message));
      break;
    case "anon-message":
      createLine(nick(message.name) + HTMLescape(" = " + message.message));
      break;
    case "center-message": // fake type, but whatever
      createLine(message.message).classList.add("centermsg");
      break;
    case "chat-message":
      if (message.message.length > 488) {
        message.message = "Too long...";
      }
      li = document.createElement("li");
      li.innerHTML = nick(message.nick) + HTMLescape(" : " + message.message);
      li.setAttribute("meta-hat", message.hat); // can't use createLine
      li.setAttribute("meta-count", message.count); // ditto
      ul.appendChild(li);
      li.scrollIntoView(false);
      break;
    case "elbot-message":
      createLine(nick(message.nick) + HTMLescape(" > " + message.message));
      break;
    case "elbot-response":
      createLine(nick(message.nick) + HTMLescape(" < " + message.message));
      break;
    case "error-message":
      createLine('ERROR: ' + HTMLescape(message.message));
      break;
    case "general-message":
      createLine('GENERAL: ' + HTMLescape(message.message));
      break;
    case "personal-message":
      createLine("{"+ nick(message.nick) + "}:"+ HTMLescape(message.message));
      break;
    case "spoken-message":
      createLine(nick(message.nick) + HTMLescape(" : " + message.message)).setAttribute("meta-voice", message.voice);
      break;
    case "system-message":
      createLine(HTMLescape(message.message)).classList.add("system");
      break;
    default:
      console.log(message);
      break;
  }
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
      case "login":
      case "nick":
      case "notification":
      case "part":
      case "password":
      case "private":
      case "role":
      case "theme":
      case "vHost":
      case "whitelist":
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
// command = scpecial commands handler
function command_error() {
  createLine('command: unknown command, type /help for help');
}
function command_clear() {
  div.removeChild(ul);
  ul = div.appendChild(document.createElement("ul"));
}
function command_echo(obj) {
  createLine(HTMLescape(obj.text));
}
function command_help(obj) {
  switch (obj.command.trim()) {
    case "":
      createLine('command: Current commands:');
      for (str0 in commands) {
        if (str0 == "") continue;
        str1  = "command: "
        str1 += str0;
        arr0 = commands[str0];
        for (num0 = 3, num1 = arr0[0] +3; num0 != num1; num0 ++) {
          str1 += ' ';
          str1 += arr0[num0];
        }
        createLine(HTMLescape(str1));
      }
      break;
    case "anon": case "change_password": case "clear": case "echo":
    case "elbot": case "help": case "kill": case "list": case "login":
    case "mask": case "me": case "msg": case "nick": case "part":
    case "pm": case "register": case "speak": case "unregister":
    case "verify": case "whoami": case "whois":
      createLine('command: '+ HTMLescape(commands["/"+ obj.command][2]));
      break;
    default:
      createLine('command: /'+ HTMLescape(obj.command) +' is not documented yet.');
      break;
  }
}
// socket = event handlers for the websocket (and other things)
function socket_message(event) {
  str0 = event.data;
  switch (str0.charAt(0)) {
    case "0": // open
      obj0 = JSON.parse(str0.substring(1));
      pingInterval = obj0.pingInterval;
      sid = obj0.sid;
      if (/[?&]flair=[^&]/.test(location_search)) {
        flair = decodeURIComponent(location_search.match(/[?&]flair=(.*?)(&|$)/)[1]);
      } else {
        flair = sid;
      }
      if (channel != "/") {
        socket.send("40" + channel);
      }
      // fallthrough
    case "3": // pong
      pingTimeout = setTimeout(function() {
        clearTimeout(pingTimeout);
        socket.send("2");
      }, pingInterval);
      break;
    case "4": // message
      // get channel and additional data
      if (str0.charAt(2) == "/") {
        num0 = str0.indexOf(",");
        if (num0 == -1) {
          str1 = str0.substring(2);
          num0 = str0.length;
        } else {
          str1 = str0.substring(2, num0);
          num0 ++;
        }
      } else {
        str1 = "/";
        num0 = 2;
      }
      // if it is not the chan we want we just dismiss it
      if (str1 != channel) {
        break;
      }
      switch (str0.charAt(1)) {
        case "0": // connect
          if (/[?&](nick|(user)?name)=[^&]/.test(location_search)) { // nick / username / name
            str1 = unescape(decodeURIComponent(location_search.match(/[?&](nick|(user)?name)=(.*?)(&|$)/)[3]));
          } else {
            str1 = sid;
          }
          socket.send("42" + channel_ + JSON.stringify(["join", {"nick":str1}]));
          break;
        case "1": // disconnect
          socket_setup();
          break;
        case "2": // event
          arr0 = JSON.parse(str0.substring(num0));
          (fromserver[arr0[0]] || fromserver[""])(arr0[1]);
          break;
        case "4": // error
          createLine('44: ' + HTMLescape(JSON.parse(str0.substring(num0))));
          channel = "/";
          channel_ = ""; // note that "/," work too
          socket_setup();
          break;
      }
      break;
  }
}
function socket_setup() {
  if (pingTimeout != 0) {
    clearTimeout(pingTimeout);
  }
  socket.close();
  socket = new WebSocket("ws://37.48.64.47/socket.io/?transport=websocket");
  //socket = new WebSocket("wss://ws.spooks.me/socket.io/?transport=websocket");
  socket.addEventListener("close", function socket_close(event) {
    console.log("close %O", event);
    if (event.code != "1000") {
      socket_setup();
    }
  });
  socket.addEventListener("error", function socket_error(event) {
    console.log("error %O", event);
  });
  socket.addEventListener("open", function socket_open(event) {
    console.log("open  %O", event);
  });
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
  str0 = input.value;
  if (str0.charAt(0) == "~" && /^~\w{2,}(?: .+)?/.test(str0)) {
    obj0 = {};
    str1 = str0.match(/^~\w+/)[0];
    arr0 = commands[str1] || commands[""];
    switch (arr0[0]) {
      case 1:
        arr1 = str0.match(/^~\w+ (.+)$/) || ["", ""];
        obj0[arr0[3]] = arr1[1];
        break;
      case 2:
        arr1 = str0.match(/^~\w+ ((?:~.|[^~ ])+) (.+)$/) || ["", "", ""];
        obj0[arr0[3]] = arr1[1].replace(/~(.)/g, "$1");
        obj0[arr0[4]] = arr1[2];
        break;
    }
    if (arr0[1] == 0) {
      socket.send("42" + channel_ + JSON.stringify(["command", {"name":str1.slice(1), "params":obj0}]));
    } else {
      arr0[arr0[1]](obj0);
    }
  } else { // basic message
    socket.send("42" + channel_ + JSON.stringify(["message", {"flair":flair, "message":str0}]));
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
socket_setup();
