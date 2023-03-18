//The express object is useful for more than creating a server. Here we use the Router function to create a new router, 
//and then export it from the script.
const express = require('express');
//creates a new router instance by calling express.Router() and is assigned to the 
// usersRouter constant.
const usersRouter = express.Router();

//middleware function logs a message to the console when a request is made to /users and sends a JSON 
//response containing a message property with the value 'hello from /usesrs!'.
usersRouter.use((req, res, next) => {
    console.log("A request is being made to /users");

    // res.send({message: 'hello from /users!'});
    next();
});

//-----------------------------------------------------------------------
//destructure function from db/index.js
//**in order to use function, need reference connection to 'client' in root index.js**
const { getAllUsers } = require('../db');

// That middleware will fire whenever a GET request is made to /api/users
// It will send back a simple object, with an empty array.
//when a request comes in, we first ask the database for the data we want, then send it back to the user.
usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();

    res.send({
        users
    });
});


//exports usersRouter instance, so that it can be used by other modules.
module.exports = usersRouter;

//-----------------------------------------------------------------------------
// Any time a request is made to a path starting with /api the apiRouter will be held responsible for making decisions, calling middleware, etc.
// apiRouter will match paths now with the /api portion removed
// This means that if we hit /api/users, apiRouter will try to match /users (which it can), and it will then pass on the responsibility to the usersRouter
// Finally usersRouter will try to match (now with /api/users removed from the original matching path), and fire any middleware.