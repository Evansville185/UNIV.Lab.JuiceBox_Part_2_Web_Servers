const express = require('express');
// creates a new router instance by calling express.Router(). and assigned to apiRouter constant.
const apiRouter = express.Router();

//component routes-----------------------------------------------------
// imports another router module for handling requests related to users.
const usersRouter = require("./users");
// imports router module for handling requests related to posts.
const postsRouter = require("./posts");
const tagsRouter = require("./tags");

//apiRouter route path-----------------------------------------------------------------------
// The line apiRouter.use("/users", usersRouter); adds the usersRouter module as a middleware 
// to the /users route of apiRouter. This means that any request that starts with /users will 
// be forwarded to usersRouter to handle.
apiRouter.use("/users", usersRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/tags", tagsRouter);





module.exports = apiRouter;

// exports an instance of an Express Router named apiRouter that is used to define 
// routes for a RESTful API.
