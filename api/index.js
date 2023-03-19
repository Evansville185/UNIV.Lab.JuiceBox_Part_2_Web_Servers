const express = require("express");
const apiRouter = express.Router();

// Before we start attaching our routers
const jwt = require("jsonwebtoken");
const { getUserById } = require("../db");
const { JWT_SECRET } = process.env;

//jwt request setup-------------------------------------------------------------------------------
// set `req.user` if possible
apiRouter.use(async (req, res, next) => {
	const prefix = "Bearer ";
	const auth = req.header("Authorization");

	if (!auth) {
		// nothing to see here
		next();
	} else if (auth.startsWith(prefix)) {
		const token = auth.slice(prefix.length);

		try {
			const { id } = jwt.verify(token, JWT_SECRET);

			if (id) {
				req.user = await getUserById(id);
				next();
			}
		} catch ({ name, message }) {
			next({ name, message });
		}
	} else {
		next({
			name: "AuthorizationHeaderError",
			message: `Authorization token must start with ${prefix}`,
		});
	}
});
// You can see by the if/else if/else we have three possibilities with every request to /api:

// 1.IF: The Authorization header wasn't set. This might happen with registration or login, or when the browser doesn't have a saved token. Regardless of why, there is no way we can set a user if their data isn't passed to us.
// 2.ELSE IF: It was set, and begins with 'Bearer' followed by a space. If so, we'll read the token and try to decrypt it. a. On successful 'verify', try to read the user from the database b. A failed 'verify' throws an error, which we catch in the catch block. We read the 'name' and 'message' on the error and pass it to 'next()'.
// 3.ELSE: A user set the header, but it wasn't formed correctly. We send a 'name' and 'message' to 'next()'
// in one case we might add a key to the 'req' object, and in two of the cases we might pass an error object to 'next'.

//component routes------------------------------------------------------------------------------
// creates a new router instance by calling express.Router(). and assigned to apiRouter constant.

// imports another router module for handling requests related to users.
const usersRouter = require("./users");
// imports router module for handling requests related to posts.
const postsRouter = require("./posts");
// imports router module for handling requests related to tags.
const tagsRouter = require("./tags");

//apiRouter route path-----------------------------------------------------------------------
// The line apiRouter.use("/users", usersRouter); adds the usersRouter module as a middleware
// to the /users route of apiRouter. This means that any request that starts with /users will
// be forwarded to usersRouter to handle.
apiRouter.use("/users", usersRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/tags", tagsRouter);

//let API to display errors from request to /api(and it's children) to be JSON error object
//any time middleware that the 'apiRouter' might be the parent router for calls 'next' with an object (rather than just 'next()'), we will skip straight to the error handling middleware and send back the object to the front-end.
apiRouter.use((error, req, res, next) => {
	res.send({
		name: error.name,
		message: error.message,
	});
});

module.exports = apiRouter;

// exports an instance of an Express Router named apiRouter that is used to define
// routes for a RESTful API.
