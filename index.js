require("dotenv").config("./.env");
const PORT = 3000;
const express = require("express");
const server = express();
const morgan = require("morgan");
server.use(morgan("dev"));

const { client } = require("./db");
client.connect();

//displays active port
server.use(express.json());

server.listen(PORT, () => {
	console.log("The server is up on port", PORT);
});

server.use((req, res, next) => {
	console.log("<____Body Logger START____>");
	console.log(req.body);
	console.log("<____Body Logger END____>");

	next();
});

//api site path
const apiRouter = require("./api");
server.use("/api", apiRouter);

//no specific endpoint, directory to available path
server.get("/", async (req, res) => {
	res.send(`
		<body style="background: indigo">
		<h1 style="color:purple; font-family:Sans Serif; font-size:30px"><u>JuiceBox Directory</u></h1>
		<ul>
			<li><a href="https://juicebox-part-2-servers.onrender.com/api/posts" style="color:yellow; font-family:Sans Serif; font-size:20px">Posts</a></li><br />
			<li><a href="https://juicebox-part-2-servers.onrender.com/api/users" style="color:yellow; font-family:Sans Serif; font-size:20px">Users</a></li><br />
			<li><a href="https://juicebox-part-2-servers.onrender.com/api/tags" style="color:yellow; font-family:Sans Serif; font-size:20px">Tags</a></li><br />
		</ul>
	  </body>
	`);
});
