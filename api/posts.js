//refer to users.js for reference setup to apiRouter
const express = require("express");
const postsRouter = express.Router();
const { requireUser } = require("./utils");
const { getAllPosts, createPost, updatePost, getPostById } = require("../db");

postsRouter.use((req, res, next) => {
	console.log("A request is being made to /posts");

	next();
});

//creating a post---------------------------------------------
postsRouter.post("/", requireUser, async (req, res, next) => {
	// res.send({ message: 'under construction' });
	const { title, content, tags = "" } = req.body;

	//refer to notes for tagArr
	// tags.trim().split(/\s+/) is pretty neat. First the call to trim() removes any spaces in the front or back,
	// and then split will turn the string into an array, splitting over any number of spaces. If the front-end sends
	// us " #happy #bloated #full", then tagArr will be equal to ["#happy", "#boated", "#full"].
	const tagArr = tags.trim().split(/\s+/);
	const postData = {};

	//only send the tags if there are some to send
	if (tagArr.length) {
		postData.tags = tagArr;
	}

	try {
		// add authorId, title, content to postData object
		postData.authorId = req.user.id;
		postData.title = title;
		postData.content = content;

		// const post = await createPost(postData);
		const post = await createPost(postData);
		// this will create the post and the tags for us
		// if the post comes back, res.send({ post });
		res.send({ post });
		// otherwise, next an appropriate error object
	} catch ({ name, message }) {
		next({ name, message });
	}
});

//getallposts-------------------------------------------------
postsRouter.get("/", async (req, res, next) => {
	try {
		const allPosts = await getAllPosts();

		//refer to notes for alternate way to writing filter with multiple if statements with the same return value;
		const posts = allPosts.filter((post) => {
			// keep a post if it is either active, or if it belongs to the current user
			// a filter function should return something truthy if we want to keep the object, or something falsy if we don't.
			if (post.active) {
				return true;
			}

			// the post is not active, but it belogs to the current user
			// So we have to do the req.user && .... trick, because if req.user isn't defined, we can't call .id on it.
			if (req.user && post.author.id === req.user.id) {
				return true;
			}

			// none of the above are true
			return false;
		});

		res.send({
			posts,
		});
	} catch ({ name, message }) {
		next({ name, message });
	}
});

//updating post-----------------------------------------------
postsRouter.patch("/:postId", requireUser, async (req, res, next) => {
	const { postId } = req.params;
	const { title, content, tags } = req.body;

	const updateFields = {};

	if (tags && tags.length > 0) {
		updateFields.tags = tags.trim().split(/\s+/);
	}

	if (title) {
		updateFields.title = title;
	}

	if (content) {
		updateFields.content = content;
	}

	try {
		const originalPost = await getPostById(postId);

		if (originalPost.author.id == req.user.id) {
			const updatedPost = await updatePost(postId, updateFields);
			res.send({ post: updatePost });
		} else {
			next({
				name: "UnauthorizedUserError",
				message: "You cannot update a post that is not yours",
			});
		}
	} catch ({ name, message }) {
		next({ name, message });
	}
});

//deactivate posts----------------------------------------------
// Because we've set up an active column in our post table, and (on creation) set it to true by default,
// we can simply update a post to have active: false (not changing anything else) to delete it.
postsRouter.delete("/:postId", requireUser, async (req, res, next) => {
	try {
		const post = await getPostById(req.params.postId);

		if (post && post.author.id === req.user.id) {
			const updatedPost = await updatePost(post.id, { active: false });

			res.send({ post: updatedPost });
		} else {
			// if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
			next(
				post
					? {
							name: "UnauthorizedUserError",
							message: "You cannot delete a post which is not yours",
					  }
					: {
							name: "PostNotFoundError",
							message: "That post does not exist",
					  }
			);
		}
	} catch ({ name, message }) {
		next({ name, message });
	}
});

module.exports = postsRouter;

// When we call 'createPost', it is expecting it to be called with an object, with keys authorId, title, content,
// and tags. It is also expecting tags to be an array.
// This is the contract between the server and the database, as dictated by the code we wrote for the database.
// However, we might want a simpler contract between our front-end and our API. There's no reason for it to be
// the same. We can improve the front-end coding experience by taking a bit of a hit in our server-side code.
