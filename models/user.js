import Datastore from "nedb";
//importera nedb för att kunna skapa och hantera databaser
import { v4 as uuidv4 } from "uuid";
//importerar v4-metoden från uuid-biblioteket och omdöper den till uuidv4 för användning i kod.

const userDb = new Datastore({ filename: "users.db", autoload: true });
//Variabeln userDb har skapats för att lagra användarinformation i form av databasen users.db.

const createUser = (username, password, callback) => {
  const userId = uuidv4();
  const newUser = { userId, username, password, orders: [] };
  userDb.insert(newUser, callback);
}; //Funktionen används för att skapa en ny användare i databasen

const getUserById = (userId, callback) => {
  userDb.findOne({ userId }, callback);
}; // Funktionen används för att hämta en användare från databasen baserat på användar-ID.

/*module.exports = {
  createUser,
  getUserById
};*/
const validateUser = (username, password, callback) => {
  userDb.findOne({ username: username, password: password }, callback);
};

export { createUser, getUserById, validateUser };
