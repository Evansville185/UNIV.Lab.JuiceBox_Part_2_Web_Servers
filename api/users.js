//The express object is useful for more than creating a server. Here we use the Router function to create a new router,
//and then export it from the script.
const express = require("express");
//creates a new router instance by calling express.Router() and is assigned to the
// usersRouter constant.
const usersRouter = express.Router();
const jwt = require("jsonwebtoken");

//middleware function logs a message to the console when a request is made to /users and sends a JSON
//response containing a message property with the value 'hello from /usesrs!'.
usersRouter.use((req, res, next) => {
	console.log("A request is being made to /users");

	// res.send({ message: 'hello from /users!' });
	next();
});

//-----------------------------------------------------------------------
//destructure function from db/index.js
//**in order to use function, need reference connection to 'client' in root index.js**
const { getAllUsers, getUserByUsername, createUser } = require("../db");

// That middleware will fire whenever a GET request is made to /api/users
// It will send back a simple object, with an empty array.
//when a request comes in, we first ask the database for the data we want, then send it back to the user.
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
  
  //practicing validations of body---------
  if(!username || username == '') {
    next({
      name: "MissingUsernameError",
      message: "Username not filled out"
    })
  } else if(!password || password == '' || password.length < 4) {
    next({
      name: "MissingPasswordError Or PasswordNeedsToBeLongerThan4Characters",
      message: "Password not filled out or needs to be longer than 4 characters"
    })
  } else if(!name || name == '') {
    next({
      name: "MissingNameError",
      message: "Name not filled out"
    })
  } else if(!location || location == '') {
    next({
      name: "MissingLocationError",
      message: "Location not filled out"
    })
  } else {
  //practicing validatios of body---------
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

//exports usersRouter instance, so that it can be used by other modules.
module.exports = usersRouter;

//-----------------------------------------------------------------------------
// Any time a request is made to a path starting with /api the apiRouter will be held responsible for making decisions, calling middleware, etc.
// apiRouter will match paths now with the /api portion removed
// This means that if we hit /api/users, apiRouter will try to match /users (which it can), and it will then pass on the responsibility to the usersRouter
// Finally usersRouter will try to match (now with /api/users removed from the original matching path), and fire any middleware.
