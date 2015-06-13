var url = require("url")
  , fs = require("fs")
  , ws = require("ws")
  , server = require("http").createServer()
  , socket = new ws.Server({"server": server, "verifyClient": socket_verify})
;
function socket_verify(info, cb) {
  if (info.origin === "http://localhost:8080/") {
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
server.on("clientError", function http_onclientError(err, socket) {
  if (err.code !== "HPE_INVALID_METHOD") { // it append more than it should
    console.dir({"name":arguments.callee.name, "err":err, "socket":socket}, {"colors":true, "depth":null});
  }
});
server.on("listening", function server_onlistening() {
  console.log("the server should be working now ...");
});
server.on("request", function http_onrequest(req, res) {
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
server.listen(8080);