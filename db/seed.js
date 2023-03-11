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
		});

		await createPost({
			authorId: sandra.id,
			title: "Second Post",
			content: "This is my second post. I do love writing blogs as much as I love writing them.",
		});

		await createPost({
			authorId: glamgal.id,
			title: "Third Post",
			content:
				"This is my third post. I had a change of heart with writing blogs. I realized I don't love writing blogs as much.",
		});
		console.log("Finished creating posts!");
	} catch (error) {
		console.log("Error creating posts!");
		throw error;
	}
}

async function createInitialTags() {
	try {
		console.log("Starting to create tags...");

		const [happy, sad, inspo, catman] = await createTags([
			"#happy",
			"#worst-day-ever",
			"#youcandoanything",
			"#catmandoeverything",
		]);

		const [postOne, postTwo, postThree] = await getAllPosts();

		await addTagsToPost(postOne.id, [happy, inspo]);
		await addTagsToPost(postTwo.id, [sad, inspo]);
		await addTagsToPost(postThree.id, [happy, catman, inspo]);

		console.log("Finished creating tags!");
	} catch (error) {
		console.log("Error creating tags!");
		throw error;
	}
}

// then modify rebuildDB to call our new function(createInitialUsers)
async function rebuildDB() {
	try {
		client.connect();

		await dropTables();
		await createTables();
		await createInitialUsers();
		await createInitialPosts();
		await createInitialTags();
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

		console.log("Calling updatePost on posts[0]");
		const updatePostResult = await updatePost(posts[0].id, {
			title: "New Title",
			content: "Updated Content",
		});
		console.log("Result:", updatePostResult);

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
//start @ 6.2.3 right before THEN, CREATE THE METHODS
