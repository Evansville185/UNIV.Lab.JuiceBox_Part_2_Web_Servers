//We are going to put our seed.js file on live reload so that we can see what's happening as we make changes. For now we will rely on logging to see what's happening under the hood as we go.
const { Client } = require("pg"); // imports the pg module
//The pg module is a Node.js package for working with PostgreSQL databases. The Client object is a class provided by the pg module that you can use to create a client connection to a PostgreSQL database.

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
async function createPost({ authorId, title, content }) {
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

		return post;
	} catch (error) {
		throw error;
	}
}

async function updatePost(id, fields = {}) {
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
			rows: [post],
		} = await client.query(
			`
		UPDATE posts
		SET ${setString}
		WHERE id=${id}
		RETURNING *;
	  `,
			Object.values(fields)
		);

		return post;
	} catch (error) {
		throw error;
	}
}

async function getAllPosts() {
	try {
		const { rows } = await client.query(`
		SELECT *
		FROM posts;
	  `);

		return rows;
	} catch (error) {
		throw error;
	}
}

async function getPostsByUser(userId) {
	try {
		const { rows } = await client.query(`
		SELECT * 
		FROM posts
		WHERE "authorId"=${userId};
	  `);

		return rows;
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
	getPostsByUser,
};
//start @ 6.2.3

//
