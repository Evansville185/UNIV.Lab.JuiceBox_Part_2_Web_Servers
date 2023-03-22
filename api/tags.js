const express = require("express");
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require("../db");

tagsRouter.use((req, res, next) => {
	console.log("A request is being made to /tags");

	next();
});

//get all tags---------------------------------------------
tagsRouter.get("/", async (req, res) => {
	const tags = await getAllTags();

	res.send({
		tags,
	});
});

//get posts by tagname------------------------------------
tagsRouter.get("/:tagName/posts", async (req, res, next) => {
	console.log("what im sending", req.params.tagName);
	// read the tagname from the params
	const { tagName } = req.params;
    
	try {
		// use our method to get posts by tag name from the db
		const allPosts = await getPostsByTagName(decodeURIComponent(tagName));
		const posts = allPosts.filter((post) => {
			// keep a post if it is either active, or if it belongs to the current user
			if (post.active) {
				return true;
			}

			// the post is not active, but it belongs to the current user
			if (req.user && post.author.id === req.user.id) {
				return true;
			}

			// none of the above are true
			return false;
		});

		// send out an object to the client { posts: // the posts }
		res.send({ posts });
	} catch ({ name, message }) {
		// forward the name and message to the error handler
		next({ name, message });
	}
});

module.exports = tagsRouter;
