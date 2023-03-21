require("dotenv").config("./.env");
const PORT = 3000;
const express = require("express");
const server = express();
const morgan = require("morgan");
// function which logs out the incoming requests: GET /api/users 304 19.825 ms - -
//We get the method, the route, the HTTP response code (here, 304), and how long it took to form.
server.use(morgan("dev"));

//connected
const { client } = require("./db");
client.connect();


// const bodyParser = require('body-parser');
// server.use(bodyParser.json());


// function will read incoming JSON from requests. The request's header has to be Content-Type: application/json,
// but we get the benefit of being able to send objects easily to our server.
server.use(express.json());

server.listen(PORT, () => {
	console.log("The server is up on port", PORT);
});

//When attaching middleware, below can be specified:
// The method: get, post, patch, put, and delete, or method agnostic (use)
// An optional request path that must be matched, e.g. /api/users, or even with a placeholder /api/users/:userId
// A function with either three or four parameters
// three parameter needs request, response, and next in that order
// four parameter needs error, request, response and next, in that order
// four parameter functions are considered error handling middleware (which is why the error is prioritized)

server.use((req, res, next) => {
	console.log("<____Body Logger START____>");
	console.log(req.body);
	console.log("<____Body Logger END____>");

	next();
});

// In the first scenario app.use would fire (it likes all types of requests), log, and then call next.
// Since app.get matches the same path, it would then fire, log, and send back a JSON response.
// server.use("/api", (req, res, next) => {
// 	console.log("A request was made to /api");
// 	next();
// });

// server.get("/api", (req, res, next) => {
// 	console.log("A get request was made to /api");
// 	res.send({ message: "success" });
// });

// In the second, app.get would fire (it matches the request precisely), log, and then send back a JSON response. Since it doesn't call
// next() (and moreover, shouldn't since it is sending back a response), we never move forward to app.use and so that second log won't happen.
// server.get('/api', (req, res, next) => {
// 	console.log("2A get request was made to /api");
// 	res.send({ message: "success" });
//   });
  
// server.use('/api', (req, res, next) => {
// 	console.log("2A request was made to /api");
// 	next();
//   });
//However, if a POST request was made to /api, the app.get middleware would be skipped over, and the app.use would go off, log, and move on to the next match.

const apiRouter = require("./api");
server.use("/api", apiRouter);
