var crypto = require("crypto")
  , url = require("url")
  , fs = require("fs")
  , ws = require("ws")
  , server_http = require("http").createServer()
  , server_ws = new ws.Server({"server": server_http, "verifyClient": socket_verify})

  , sessions = new Map()
  , channels = new Map()
  , whirlpool = crypto.createHash("whirlpool")
;
function incrementBuffer(buffer) {
  var i = 0, j = buffer.length, carry = true;
  while (carry && i !== j) {
    if (buffer[i] === 0xFF) {
      buffer[i] = 0;
      i ++;
    } else {
      buffer[i] ++;
      carry = false;
    }
  }
};
function socket_verify(info, cb) {
  if (info.origin === "http://localhost:8080") {
    cb(true);
  } else {
    cb(false, 400);
  }
};
function http_grab(res, file_path, mime_type) {
  fs.stat(file_path, function fs_stat(err, stats) {
    var stream;
    if (err !== null) {
      res.writeHead(404);
      return res.end();
    }
    stream = fs.createReadStream(file_path);
    stream.on("error", function stream_onerror(err) {
      res.writeHead(500);
      return res.end();
    });
    res.writeHead(200, {
      "Content-Type": mime_type,
      "Content-Length": stats.size
    });
    stream.pipe(res);
  });
};
// websocket server part
server_ws.on("error", function server_ws_onerror(error) {
  console.dir({"name":arguments.callee.name, "error":error}, {"colors":true, "depth":2});
});
server_ws.on("connection", function server_ws_connection(socket) {
  var this_id_real_buffer = crypto.randomBytes(64)
    , this_id_real_string = ""
    , this_id_fake_buffer = new Buffer(this_id_real_buffer)
    , this_id_fake_string = ""
    , this_session
  ;
  function close() {
    clearTimeout(this_session.beatPing);
    clearTimeout(this_session.beatPong);
    sessions.delete(this_id_fake_string);
    sessions.delete(this_id_real_string);
  };
  // creating a session for the socket
  /* just a side note
   *  the session ID is a 512bits long number
   *  the fake ID is 512bits bytes longs too
   *  and I am supposing whirlpool does not collide
   *  like ever, but for our concern it will not
   *  so this give a potential space of (2^512) /2 entries
   *                         6 703 903 964
   *       971 298 549 787 012 499 102 923
   *       063 739 682 910 296 196 688 861
   *       780 721 860 882 015 036 773 488
   *       400 937 149 083 451 713 845 015
   *       929 093 243 025 426 876 941 405
   *       973 284 973 216 824 503 042 048
   *  that's way too big to be remotely usefull in any way
   *  every IPv6 could join in and there might still be space
   *  but will hopefull prevent brute-forcing an ID
   *  ouray -InvSqrt
   */
  while (true) {
    incrementBuffer(this_id_real_buffer); // whitch craft!
    
    this_id_real_string = this_id_real_buffer.toString("hex");
    if (sessions.has(this_id_real_string)) {
      continue;
    }
    
    whirlpool = crypto.createHash("whirlpool");
    whirlpool.update(this_id_real_buffer);
    this_id_fake_buffer = whirlpool.digest();
    
    this_id_fake_string = this_id_fake_buffer.toString("hex");
    if (sessions.has(this_id_fake_string)) {
      continue;
    }
    // real and fake ID are not already in use
    break;
  };
  
  this_session = Object.create(null, {
    "socket"    : {"writable": true, "value": socket },
    "channels"  : {"writable": true, "value": [] },
    "nicks"     : {"writable": true, "value": [] },
    "nick"      : {"writable": true, "value": "" },
    "beatPing"  : {"writable": true, "value": 0  },
    "beatPong"  : {"writable": true, "value": 0  },
    "level"     : {"writable": true, "value": 0  },
    "ID_real"   : {"value": this_id_real_string},
    "ID_fake"   : {"value": this_id_fake_string}
  });
  Object.seal(this_session);
  
  this_session.beatPing = setTimeout(function socket_ping() {
    return socket.ping(new Buffer(this_id_fake_string, "hex"));
  }, 10 *1000);
  this_session.beatPong = setTimeout(function socket_pong() {
    return socket.close(1000);
  }, 20 *1000);
  
  sessions.set(this_id_real_string, this_session);
  sessions.set(this_id_fake_string, this_session);
  socket.session = this_session;
  
  //because everyone loves to log everything
  socket.send_ = socket.send;
  socket.send = function(buffer) {
    console.log("<=="+ buffer.toString("hex"));
    socket.send_(buffer);
  };
  
  socket.send(new Buffer("80"+this_id_real_string, "hex"));
  
  socket.on("error", function socket_onerror(error) {
    console.dir({"name":arguments.callee.name, "error":error}, {"colors":true, "depth":2});
    socket.terminate();
  });
  
  socket.on("close", function socket_onclose(code, message) {
    console.dir({"name":arguments.callee.name, "code":code, "message":message}, {"colors":true, "depth":1});
    close();
  });
  
  socket.on("message", function socket_onmessage(data, flags) {
    if (flags.binary && flags.masked) {
      console.log("==>"+ data.toString("hex"));
      if (data.length > 255 || (data[0] & 0x80) !== 0) {
        return socket.close(1009);
      }
      switch (data[0]) {
        case 0x00:
          data.writeUInt8(0x81, 0);
          socket.send(data);
          break;
        case 0x01:
          break;
        case 0x02:
          break;
        case 0x03:
          break;
        case 0x04:
          break;
      }
    } else {
      return socket.close(1003);
    }
  });
  
  socket.on("ping", function socket_ping(data, flags) {
    return socket.close(1003);
  });
  
  socket.on("pong", function socket_pong(data, flags) {
    if (flags.binary && flags.masked) {
      if (data.toString("hex") === this_id_fake_string) {
        clearTimeout(this_session.beatPing);
        clearTimeout(this_session.beatPong);

        this_session.beatPing = setTimeout(function socket_ping() {
          return socket.ping(new Buffer(this_id_fake_string, "hex"));
        }, 60 *1000);
        this_session.beatPong = setTimeout(function socket_pong() {
          return socket.close(1000);
        }, 70 *1000);
      } else {
        return socket.close(1008);
      }
    } else {
      return socket.close(1003);
    }
  });
});
// http server part
server_http.on("clientError", function server_http_onclientError(err, socket) {
  if (err.code !== "HPE_INVALID_METHOD") { // it append more than it should
    console.dir({"name":arguments.callee.name, "err":err, "socket":socket}, {"colors":true, "depth":null});
  }
});
server_http.on("listening", function server_http_onlistening() {
  console.log("the server should be working now ...");
});
server_http.on("request", function server_http_onrequest(req, res) {
  if (req.method === "GET") {
    switch (req.url) {
      case "/robots.txt":
        return http_grab(res, "robots.txt", "text/plain; charset=UTF-8");
      case "/favicon.ico":
        return http_grab(res, "favicon.ico", "image/x-icon; charset=UTF-8");
      case "/.es":
        return http_grab(res, "file.es", "application/ecmascript; charset=UTF-8");
      case "/.css":
        return http_grab(res, "file.css", "text/css; charset=UTF-8");
      default:
        return http_grab(res, "file.html", "text/html; charset=UTF-8");
    }
  } else {
    res.writeHead(405, {
      "Allow": "GET"
    });
    return res.end();
  }
});
server_http.listen(8080);