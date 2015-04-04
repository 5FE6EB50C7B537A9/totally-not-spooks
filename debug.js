function addon_parse(event) {
  var data = event.data
    , i = 0
    , name = ""
    , json = ""
    , json_ = ["message",{
        "type":"error-message",
        "message":"no data in the message"
      }];
  switch (data.charAt(0)) {
    case "0": // open
      console.log("0");
      break;
    case "3": // pong
      console.log("3");
      break;
    case "4": // message
      if (data.charAt(2) == "/") {
        i = data.indexOf(",");
        if (i == -1) {
          name = data.substring(2);
        } else {
          name = data.substring(2, i);
          json = data.substring(i +1);
        }
      } else {
        name = "/";
        json = data.substring(2);
      }
      if (json != "") {
        json_ = JSON.parse(json);
      }
      switch (data.charAt(1)) {
        case "0": // connect
          console.log("40%s %O%s", name, json_, json.length > 140 ? json.substring(0, 140) + "\u2026" : json);
          break;
        case "1": // disconnect
          console.log("41%s %O%s", name, json_, json.length > 140 ? json.substring(0, 140) + "\u2026" : json);
          break;
        case "2": // event
          console.log("42%s %O%s", name, json_, json.length > 140 ? json.substring(0, 140) + "\u2026" : json);
          break;
        case "4": // error
          console.log("44%s %O%s", name, json_, json.length > 140 ? json.substring(0, 140) + "\u2026" : json);
          break;
      }
      break;
  }
}