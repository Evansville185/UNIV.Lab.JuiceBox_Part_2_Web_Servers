const express = require("express");
// creates a new router instance by calling express.Router(). and assigned to apiRouter constant.
const apiRouter = express.Router();

// imports another router module for handling requests related to users.
const usersRouter = require("./users");

// The line apiRouter.use("/users", usersRouter); adds the usersRouter module as a middleware 
// to the /users route of apiRouter. This means that any request that starts with /users will 
// be forwarded to usersRouter to handle.
apiRouter.use("/users", usersRouter);





module.exports = apiRouter;

// exports an instance of an Express Router named apiRouter that is used to define 
// routes for a RESTful API.
