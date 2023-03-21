//DB notes
//Index---------------------------------------------------------------------------------

//We are going to put our seed.js file on live reload so that we can see what's happening as we make changes. 
//For now we will rely on logging to see what's happening under the hood as we go.
const { Client } = require("pg"); // imports the pg module
//The pg module is a Node.js package for working with PostgreSQL databases. The Client object is a class 
//provided by the pg module that you can use to create a client connection to a PostgreSQL database.

//supply the db name and location of the database
const client = new Client("postgres://postgres:1234@localhost:1234/juicebox-dev");

// const client = new Client({
//     user: 'postgres',
//     password: '1234',
//     host: 'localhost',
//     port: 5432,
//     database: 'juicebox-dev'
//   });

// module.exports = {
// 	client,
// };

//USER Methods---------------------------------------------------
async function createUser({ username, password, name, location }) {
	try {
		const {
			rows: [user],
		} = await client.query(
			`
		INSERT INTO users(username, password, name, location) 
		VALUES($1, $2, $3, $4) 
		ON CONFLICT (username) DO NOTHING
		RETURNING *;
	  `,
			[username, password, name, location]
		);

		return user;
	} catch (error) {
		throw error;
	}
}

async function updateUser(id, fields = {}) {
	// build the set string
	const setString = Object.keys(fields)
		.map((key, index) => `"${key}"=$${index + 1}`)
		.join(", ");

	// return early if this is called without fields
	if (setString.length === 0) {
		return;
	}

	try {
		const {
			rows: [user],
		} = await client.query(
			`
		UPDATE users
		SET ${setString}
		WHERE id=${id}
		RETURNING *;
	  `,
			Object.values(fields)
		);

		return user;
	} catch (error) {
		throw error;
	}
}

async function getAllUsers() {
	try {
		const { rows } = await client.query(`
		SELECT id, username, name, location, active 
		FROM users;
	  `);

		return rows;
	} catch (error) {
		throw error;
	}
}

async function getUserById(userId) {
	try {
		// first get the user (NOTE: Remember the query returns
		// (1) an object that contains
		// (2) a `rows` array that (in this case) will contain
		// (3) one object, which is our user.
		// added password in SELECT query to utilize "delete user.password" code for example case
		const {
			rows: [user],
		} = await client.query(`
			SELECT id, username, password, name, location, active
			FROM users
			WHERE id=${userId}
		  `);

		// if it doesn't exist (if there are no `rows` or `rows.length`), return null
		if (!user) {
			return null;
		}

		// if it does:
		// delete the 'password' key from the returned object
		delete user.password; //would only need if password in SELECT query
		// get their posts (use getPostsByUser)
		// then add the posts to the user object with key 'posts'
		user.posts = await getPostsByUser(userId);
		// return the user object
		return user;
	} catch (error) {
		throw error;
	}
}

//POST Methods-------------------------------------------------
//added "tags" param to createPost
async function createPost({
	authorId,
	title,
	content,
	tags = [], // this is new
}) {
	try {
		const {
			rows: [post],
		} = await client.query(
			`
		INSERT INTO posts("authorId", title, content) 
		VALUES($1, $2, $3)
		RETURNING *;
	  `,
			[authorId, title, content]
		);

		const tagList = await createTags(tags);

		return await addTagsToPost(post.id, tagList);
	} catch (error) {
		throw error;
	}
}

//Need to separate updating the post and the tags by creating more queries
//Tag list might have some new tags, but it also might be missing some of the tags that
//used to be part of the post.
async function updatePost(postId, fields = {}) {
	// read off the tags & remove that field
	const { tags } = fields; // might be undefined
	delete fields.tags;

	// build the set string
	const setString = Object.keys(fields)
		.map((key, index) => `"${key}"=$${index + 1}`)
		.join(", ");

	try {
		// update any fields that need to be updated
		if (setString.length > 0) {
			await client.query(
				`
		  UPDATE posts
		  SET ${setString}
		  WHERE id=${postId}
		  RETURNING *;
		`,
				Object.values(fields)
			);
		}

		// return early if there's no tags to update
		if (tags === undefined) {
			return await getPostById(postId);
		}

		// make any new tags that need to be made
		const tagList = await createTags(tags);
		const tagListIdString = tagList.map((tag) => `${tag.id}`).join(", ");

		// delete any post_tags from the database which aren't in that tagList
		await client.query(
			`
		DELETE FROM post_tags
		WHERE "tagId"
		NOT IN (${tagListIdString})
		AND "postId"=$1;
	  `,
			[postId]
		);

		// and create post_tags as necessary
		await addTagsToPost(postId, tagList);

		// // return early if this is called without fields
		// if (setString.length === 0) {
		// 	return;
		// }

		// try {
		// 	const {
		// 		rows: [post],
		// 	} = await client.query(
		// 		`
		// 	UPDATE posts
		// 	SET ${setString}
		// 	WHERE id=${id}
		// 	RETURNING *;
		//   `,
		// 		Object.values(fields));

		// return post;

		return await getPostById(postId);
	} catch (error) {
		throw error;
	}
}

//We also want the associated information (tags and author) on each post.
//Same method using in getPostsByUser
async function getAllPosts() {
	try {
		const { rows: postIds } = await client.query(`
		SELECT id
		FROM posts;
	  `);

		const posts = await Promise.all(postIds.map((post) => getPostById(post.id)));

		return posts;
	} catch (error) {
		throw error;
	}
}

//When we get the posts for a specific user, we will want to include the author and tags for each post.
//If we modify the original query just to return the post id, we can iterate over each post calling our
//updated getPostById, which has all the information we want in it.
async function getPostsByUser(userId) {
	try {
		const { rows: postIds } = await client.query(`
		SELECT id 
		FROM posts 
		WHERE "authorId"=${userId};
	  `);

		const posts = await Promise.all(postIds.map((post) => getPostById(post.id)));

		return posts;
	} catch (error) {
		throw error;
	}
}

async function createTags(tagList) {
	if (tagList.length === 0) {
		return;
	}

	// need something like: ($1), ($2), ($3)
	const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");
	// then we can use: (${ insertValues }) in our string template

	// need something like: $1, $2, $3
	const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
	// then we can use (${ selectValues }) in our string template

	try {
		// insert the tags, doing nothing on conflict
		// returning nothing, we'll query after
		// const {
		// 	rows: [tags],
		// } =
		await client.query(
			`
			INSERT INTO tags(name)
			VALUES (${insertValues})
			ON CONFLICT (name) DO NOTHING;
		  `,
			tagList
		);

		// select all tags where the name is in our taglist
		// return the rows from the query
		const { rows } = await client.query(
			`
		SELECT *
		FROM tags
		WHERE name
		IN (${selectValues});
		`,
			tagList
		);

		return rows;
	} catch (error) {
		throw error;
	}
}

//This function will usually follow createTags, since we will only create tags while we create posts,
//and will need to create the elements in the join table after creating the tags.

//These will be useful when we modify getPosts to include the tags, as well as when get create getPostsWithTag in a bit.
//Here the tagList needs to be the ones returned from createTags, since we need the id, not the name.
async function createPostTag(postId, tagId) {
	try {
		await client.query(
			`
		INSERT INTO post_tags("postId", "tagId")
		VALUES ($1, $2)
		ON CONFLICT ("postId", "tagId") DO NOTHING;
	  	`,
			[postId, tagId]
		);
	} catch (error) {
		throw error;
	}
}

//We can now use this multiple times in addTagsToPost. The function createPostTag is async, so it returns a promise.
//That means if we make an array of non-await calls, we can use them with Promise.all, and then await that:
async function addTagsToPost(postId, tagList) {
	try {
		const createPostTagPromises = tagList.map((tag) => createPostTag(postId, tag.id));

		await Promise.all(createPostTagPromises);

		return await getPostById(postId);
	} catch (error) {
		throw error;
	}
}

//We will want the post, and its tags, we can do that with two queries. First we need to get the post itself,
//then get its tags using a JOIN statement. We should also grab the author info using a simple query.

//Last we should add the tags and author to the post before returning it, as well as remove the authorId,
//since it is encapsulated in the author property.
async function getPostById(postId) {
	try {
		const {
			rows: [post],
		} = await client.query(
			`
      SELECT *
      FROM posts
      WHERE id=$1;
    `,
			[postId]
		);

		const { rows: tags } = await client.query(
			`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `,
			[postId]
		);

		const {
			rows: [author],
		} = await client.query(
			`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `,
			[post.authorId]
		);

		post.tags = tags;
		post.author = author;

		delete post.authorId;

		return post;
	} catch (error) {
		throw error;
	}
}

async function getPostsByTagName(tagName) {
	try {
		const { rows: postIds } = await client.query(
			`
		SELECT posts.id
		FROM posts
		JOIN post_tags ON posts.id=post_tags."postId"
		JOIN tags ON tags.id=post_tags."tagId"
		WHERE tags.name=$1;
		`,
			[tagName]
		);

		return await Promise.all(postIds.map((post) => getPostById(post.id)));
	} catch (error) {
		throw error;
	}
}

// and export them
module.exports = {
	client,
	createUser,
	updateUser,
	getAllUsers,
	getUserById,
	createPost,
	updatePost,
	getAllPosts,
	getPostById,
	getPostsByUser,
	createTags,
	createPostTag,
	addTagsToPost,
	getPostsByTagName,
};





// Seed------------------------------------------------------------------------------
// grab our client with destructuring from the export in index.js
// const { client } = require('./index');

// async function testDB() {
//   try {
//     // connect the client to the database, finally
//     client.connect();

//     // queries are promises, so we can await them
//     const result = await client.query(`SELECT * FROM users;`);

//     // for now, logging is a fine way to see what's up
//     console.log(result);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     // it's important to close out the client connection
//     client.end();
//   }
// }

// testDB();

//-------------------------------------------------
const {
	client,
	createUser,
	updateUser,
	getAllUsers,
	getUserById,
	createPost,
	updatePost,
	getAllPosts,
	getPostsByUser,
	createTags,
	addTagsToPost,
	getPostsByTagName,
} = require("./index");

async function dropTables() {
	try {
		console.log("Starting to drop tables...");

		// have to make sure to drop in correct order
		await client.query(`
		DROP TABLE IF EXISTS post_tags;
		DROP TABLE IF EXISTS tags;
		DROP TABLE IF EXISTS posts;
		DROP TABLE IF EXISTS users;
	  `);

		console.log("Finished dropping tables!");
	} catch (error) {
		console.error("Error dropping tables!");
		throw error;
	}
}

async function createTables() {
	try {
		console.log("Starting to build tables...");

		await client.query(`
		CREATE TABLE users (
			id SERIAL PRIMARY KEY,
			username varchar(255) UNIQUE NOT NULL,
			password varchar(255) NOT NULL,
			name varchar(255) NOT NULL,
			location varchar(255) NOT NULL,
			active BOOLEAN DEFAULT true
		);
		CREATE TABLE posts (
			id SERIAL PRIMARY KEY,
			"authorId" INTEGER REFERENCES users(id) NOT NULL,
			title varchar(255) NOT NULL,
			content TEXT NOT NULL,
			active BOOLEAN DEFAULT true
		);
		CREATE TABLE tags (
			id SERIAL PRIMARY KEY,
			name varchar(255) UNIQUE NOT NULL
		);
		CREATE TABLE post_tags(
			"postId" INTEGER REFERENCES posts(id),
			"tagId" INTEGER REFERENCES tags(id),
			UNIQUE ("postId", "tagId")
		);
    `);

		console.log("Finished building tables!");
	} catch (error) {
		console.error("Error building tables!");
		throw error;
	}
}

// new function, should attempt to create a few users
async function createInitialUsers() {
	try {
		console.log("Starting to create users...");

		const albert = await createUser({
			username: "albert",
			password: "bertie99",
			name: "Albert Einstein",
			location: "Ulm, Germany",
		});
		const sandra = await createUser({
			username: "sandra",
			password: "2sandy4me",
			name: "Sandra Bullock",
			location: "Austin, Texas",
		});
		const glamgal = await createUser({
			username: "glamgal",
			password: "soglam",
			name: "Glam Orous",
			location: "Toronto, Canada",
		});

		console.log(albert, sandra, glamgal);

		console.log("Finished creating users!");
	} catch (error) {
		console.error("Error creating users!");
		throw error;
	}
}

async function createInitialPosts() {
	try {
		const [albert, sandra, glamgal] = await getAllUsers();

		console.log("Starting to create posts...");
		await createPost({
			authorId: albert.id,
			title: "First Post",
			content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
			tags: ["#happy", "#youcandoanything"],
		});

		await createPost({
			authorId: sandra.id,
			title: "Second Post",
			content: "This is my second post. I don't love writing.",
			tags: ["#happy", "#worst-day-ever"],
		});

		await createPost({
			authorId: glamgal.id,
			title: "Third Post",
			content: "This is my third post. Writing makes me happy.",
			tags: ["#happy", "#youcandoanything", "#canmandoeverything"],
		});
		console.log("Finished creating posts!");
	} catch (error) {
		console.log("Error creating posts!");
		throw error;
	}
}

//This populates some post tags. But realistically we shouldn't need this step. Instead, should update
//createPost to handle creating tags.
// async function createInitialTags() {
// 	try {
// 		console.log("Starting to create tags...");

// 		const [happy, sad, inspo, catman] = await createTags([
// 			"#happy",
// 			"#worst-day-ever",
// 			"#youcandoanything",
// 			"#catmandoeverything",
// 		]);

// 		const [postOne, postTwo, postThree] = await getAllPosts();

// 		await addTagsToPost(postOne.id, [happy, inspo]);
// 		await addTagsToPost(postTwo.id, [sad, inspo]);
// 		await addTagsToPost(postThree.id, [happy, catman, inspo]);

// 		console.log("Finished creating tags!");
// 	} catch (error) {
// 		console.log("Error creating tags!");
// 		throw error;
// 	}
// }

// then modify rebuildDB to call our new function(createInitialUsers)
async function rebuildDB() {
	try {
		client.connect();

		await dropTables();
		await createTables();
		await createInitialUsers();
		await createInitialPosts();
		// await createInitialTags(); now creating tags through createPost
	} catch (error) {
		console.log("Error during rebuildDB");
		throw error;
	}
}

async function testDB() {
	try {
		console.log("Starting to test database...");

		console.log("Calling getAllUsers");
		const users = await getAllUsers();
		console.log("Result:", users);

		console.log("Calling updateUser on users[0]");
		const updateUserResult = await updateUser(users[0].id, {
			name: "Newname Sogood",
			location: "Lesterville, KY",
		});
		console.log("Result:", updateUserResult);

		console.log("Calling getAllPosts");
		const posts = await getAllPosts();
		console.log("Result:", posts);

		console.log("Calling updatePost on posts[1], only updating tags");
		const updatePostTagsResult = await updatePost(posts[1].id, {
			tags: ["#youcandoanything", "#redfish", "#bluefish"],
		});
		console.log("Result:", updatePostTagsResult);

		console.log("Calling getPostsByTagName with #happy");
		const postsWithHappy = await getPostsByTagName("#happy");
		console.log("Result:", postsWithHappy);

		console.log("Calling getUserById with 1, 2, 3");
		const albert = await getUserById(1);
		const sandra = await getUserById(2);
		const glamgal = await getUserById(3);
		console.log("Result:", albert, sandra, glamgal);

		//testing
		console.log("Calling getPostsByUser 1");
		const albert2 = await getPostsByUser(1);
		console.log("Result:", albert2);

		console.log("Finished database tests!");
	} catch (error) {
		console.log("Error during testDB");
		throw error;
	}
}

rebuildDB()
	.then(testDB)
	.catch(console.error)
	.finally(() => client.end());





//SERVER notes
//Setting up a basic server-----------------------------------------------------------------------------------------
//npm install express--------
 //install will add 'express' into dependencies in package.json, install will also install other packages of its dependencies of the parent package

//require express(express is a function)
const express = require('express');

//standard is defined as a var (const app = express())
const server = express();




//attaching a general purpose route--------
server.use
 //localhost:5000/hello = localhost is the port & hello comes from server definition
 	//takes up to 4 param(requestObject, responseObject, nextFunction)
server.get('*'), server.get('/hello', function (req, res, next ) {
	// console.log(req);
	// console.log(res);
	// console.log(next);
	res.send('hello');
});
server.post
server.patch
server.put
server.delete

//start the server------------
	//server itself is an object, with properties such as "listen" takes a few arguments ex port, callback funcction
server.listen(3000)
server.listen(5000, () => {
	console.log("Server is up!");
});

//testing it with curl----------
	//use curl to bring up localhost path
curl http://localhost:5000/hello


//subroutes with express router--------------------------------------------------------------------
const express = require('express');
const server = express();

server.get('*'), server.get('/hello', function (req, res, next ) {
	res.send('hello there');
});

server.listen(5000, ()=> {
	console.log("Server is up!");
});

//routers----------------



