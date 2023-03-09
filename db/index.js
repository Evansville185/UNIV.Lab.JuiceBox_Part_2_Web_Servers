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

//-----------------------------------------------------------
async function createUser({ username, password, name, location }) {
	try {
		const { row } = await client.query(
			`
		INSERT INTO users(username, password, name, location)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (username) DO NOTHING
		RETURNING *;
		`,
			[username, password, name, location]
		);

		return row;
	} catch (error) {
		throw error;
	}
}

async function getAllUsers() {
	const { rows } = await client.query(
		`SELECT id, username, name, location, active 
    FROM users;
  `
	);

	return rows;
}

async function updateUser(id, fields = {}) {
	//build the sett sttring
	const setString = Object.keys(fields)
		.map((key, index) => `"${key}"=$${index + 1}`)
		.join(", ");

	//return early if this is called without fields
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

async function createPost({ authoId, title,	content }) {
	try{

	} catch (error) {
		throw error;
	}
}

// and export them
module.exports = {
	client,
	getAllUsers,
	createUser,
	updateUser,
};
//start @ 6.2.3
