// grab our client with destructuring from the export in index.js
//5.1.3------------------------------------------------
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


//5.1.3------------------------------------------------
// async function testDB() {
//   try {
//     client.connect();

//     const { rows } = await client.query(`SELECT * FROM users;`);
//     console.log(rows);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     client.end();
//   }
// }

// testDB();

//5.1.4-------------------------------------------------
// const {
//   client,
//   getAllUsers
// } = require('./index');

// async function testDB() {
//   try {
//     client.connect();

//     const users = await getAllUsers();
//     console.log(users);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     client.end();
//   }
// }

// testDB();

//5.1.5---------------------------------------------
//Seeding
// Making sure that the tables have correct definitions
// Making sure that the tables have no unwanted data
// Making sure that the tables have some data for us to play with
// Making sure that the tables have necessary user-facing data


const {
  client,
  getAllUsers
} = require('./index');

// this function should call a query which drops all tables from our database
async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
      DROP TABLE IF EXISTS users;
    `); //instead of throwing an error, we see that we get a NOTICE instead! 
    //It tries it, it fails, then it moves forward with whatever the rest of our query is

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    throw error; // we pass the error up to the function that calls dropTables
  }
}

// this function should call a query which creates all tables for our database 
async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL
      );
    `);

    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error; // we pass the error up to the function that calls createTables
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
  } catch (error) {
    throw error;
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    const users = await getAllUsers();
    console.log("getAllUsers:", users);

    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    throw error;
  }
}


rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());