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
const { client, getAllUsers, createUser, updateUser } = require("./index");

async function dropTables() {
	try {
		console.log("Starting to drop tables...");

		await client.query(`
      DROP TABLE IF EXISTS users;
	  DROP TABLE IF EXISTS posts;
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
		create;
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

		console.log("Finished database tests!");
	} catch (error) {
		console.error("Error testing database!");
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
	} catch (error) {
		throw error;
	}
}

rebuildDB()
	.then(testDB)
	.catch(console.error)
	.finally(() => client.end());
//start @ 6.2.3 right before THEN, CREATE THE METHODS
