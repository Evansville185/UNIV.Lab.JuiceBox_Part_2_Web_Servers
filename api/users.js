//The express object is useful for more than creating a server. Here we use the Router function to create a new router, and then export it from the script.
const express = require('express');
const usersRouter = express.Router();

usersRouter.use((req, res, next) => {
    console.log("A request is being made to /users");

    res.send({message: 'hello from /usesrs!'});
});






module.exports = usersRouter;