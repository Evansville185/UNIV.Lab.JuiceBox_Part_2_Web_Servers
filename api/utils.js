// For the routes we are going to write (except for GET /tags/:tagName/posts), 
//we need a user to be logged in.

// Let's write a utility function in api/utils.js that will send an error for us 
//whenever there is no user:
function requireUser(req, res, next) {
    if(!req.user) {
        next({
            name: "MissingUserError",
            message: "You must be logged in to perform this action"
        });
    }

    next();
}

module.exports = {
    requireUser
}


// It's pretty straight forward, if the req.user hasn't been set 
// (which means a correct auth token wasn't sent in with the request), 
// we will send an error rather than moving on to the actual request. 
// Otherwise, we pass on to the next thing like nothing happened.

// Writing this function will allow us to reuse it in multiple places, 
// and one way you can use it is like this:

// someRouter.post('/some/route', requireUser, async (req, res, next) => {

// });

// When you pass in multiple functions after the route string, it will attach each as 
// middleware in the order they are specified. This means that when a user posts to 
// /some/route, the requireUser middleware will be called first, and then if next() is 
// called cleanly from requireUser, our anonymous middleware function will be called.