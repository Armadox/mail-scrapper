const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname =
  process.env.NODE_ENV !== "production"
    ? "admiring-goodall.212-72-171-49.plesk.page"
    : "admiring-goodall.212-72-171-49.plesk.page";
const port = process.env.PORT || 5678;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
// const path = require('path');
// const nextPath = path.join(__dirname, 'node_modules', '.bin', 'next');
// process.argv.length = 1;
// process.argv.push(nextPath, 'start');
// require(nextPath);
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === "/a") {
        await app.render(req, res, "/a", query);
      } else if (pathname === "/b") {
        await app.render(req, res, "/b", query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
    });
});
