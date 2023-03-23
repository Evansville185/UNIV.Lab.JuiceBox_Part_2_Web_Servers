//Endpoint--api/users
const express = require("express");
const usersRouter = express.Router();
const jwt = require("jsonwebtoken");
const { getAllUsers, getUserByUsername, createUser } = require("../db");

usersRouter.use((req, res, next) => {
	console.log("A request is being made to /users");

	next();
});

//getallusers-----------------------------------------------------------
usersRouter.get("/", async (req, res) => {
	const users = await getAllUsers();

	res.send({
		users,
	});
});

//login users------------------------------------------------------------
usersRouter.post("/login", async (req, res, next) => {
	const { username, password } = req.body;

	// request must have both
	if (!username || !password) {
		next({
			name: "MissingCredentialsError",
			message: "Please supply both a username and password",
		});
	}

	try {
		const user = await getUserByUsername(username);
		if (user && user.password == password) {
			// create token & return to user
			const token = jwt.sign(
				{ id: user.id, username: user.username, password: user.password },
				process.env.JWT_SECRET
			);
			token;

			const verifytoken = jwt.verify(token, process.env.JWT_SECRET);

			verifytoken;

			res.send({ message: "you're logged in!", token });
		} else {
			next({
				name: "IncorrectCredentialsError",
				message: "Username or password is incorrect",
			});
		}
	} catch (error) {
		console.log(error);
		next(error);
	}
});

//register new user-------------------------------------------------------
usersRouter.post("/register", async (req, res, next) => {
	const { username, password, name, location } = req.body;

	//practicing validations for body-------------
	if (!username) {
		next({
			name: "MissingUsernameError",
			message: "Username not filled out",
		});
	} else if (!password) {
		next({
			name: "MissingPasswordError",
			message: "Password not filled out",
		});
	} else if (password.length < 4) {
		next({
			name: "PasswordEntryError",
			message: "Password needs to be 4 characters or longer",
		});
	} else if (!name) {
		next({
			name: "MissingNameError",
			message: "Name not filled out",
		});
	} else if (!location) {
		next({
			name: "MissingLocationError",
			message: "Location not filled out",
		});
	} else {
		//practicing validatios for body-----------

		try {
			const _user = await getUserByUsername(username);

			if (_user) {
				next({
					name: "UserExistsError",
					message: "A user by that username already exists",
				});
			}

			const user = await createUser({
				username,
				password,
				name,
				location,
			});

			const token = jwt.sign(
				{
					id: user.id,
					username,
				},
				process.env.JWT_SECRET,
				{
					expiresIn: "1w",
				}
			);

			res.send({
				message: "thank you for signing up",
				token,
			});
		} catch ({ name, message }) {
			next({ name, message });
		}
	}
});

module.exports = usersRouter;
