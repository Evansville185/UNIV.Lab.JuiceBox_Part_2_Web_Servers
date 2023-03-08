//We are going to put our seed.js file on live reload so that we can see what's happening as we make changes. For now we will rely on logging to see what's happening under the hood as we go.
const { Client } = require("pg"); // imports the pg module
//The pg module is a Node.js package for working with PostgreSQL databases. The Client object is a class provided by the pg module that you can use to create a client connection to a PostgreSQL database.

//supply the db name and location of the database
//method 1 connection
const client = new Client("postgres://postgres:1234@localhost:1234/juicebox-dev");
  
//method 2 connection
// const client = new Client({
//     user: 'postgres',
//     password: '1234',
//     host: 'localhost',
//     port: 1234,
//     database: 'juicebox-dev'
//   });
  
module.exports = {
	client,
};


//5.1.4-----------------------------------------------------------
async function getAllUsers() {
	const { rows } = await client.query(
	  `SELECT id, username 
	  FROM users;
	`);
  
	return rows;
  }
  
  // and export them
  module.exports = {
	client,
	getAllUsers,
  }


// The Pattern
// In general, in our db/index.js file we should provide the utility functions 
// that the rest of our application will use. We will call them from the seed file, 
// but also from our main application file.

// That is where we are going to listen to the front-end code making AJAX 
// requests to certain routes, and will need to make our own requests to our database.