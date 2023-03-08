//We are going to put our seed.js file on live reload so that we can see what's happening as we make changes. For now we will rely on logging to see what's happening under the hood as we go.
const { Client } = require("pg"); // imports the pg module
//The pg module is a Node.js package for working with PostgreSQL databases. The Client object is a class provided by the pg module that you can use to create a client connection to a PostgreSQL database.

//supply the db name and location of the database
const client = new Client("postgres://postgres:1234@localhost:1234/juicebox-dev");

// const client = new Client({
//     connectionString: "postgres://1234@localhost:5432/juicebox-dev"
//   });
  

// const client = new Client({
//     user: 'postgres',
//     password: '1234',
//     host: 'localhost',
//     port: 5432,
//     database: 'juicebox-dev'
//   });
  
module.exports = {
	client,
};


//-----------------------------------------------------------
// async function getAllUsers() {
//     const { rows } = await client.query(
//       `SELECT id, username 
//       FROM users;
//     `);
  
//     return rows;
//   }
  
//   // and export them
//   module.exports = {
//     client,
//     getAllUsers,
//   }