import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Family_Travel_Tracker",
  password: "jh09k6008",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");

  users = result.rows;
  
  if (users.length === 0) {
    return null; // No users exist
  }
  
  return users.find((user) => user.id == currentUserId);
}


app.get("/", async (req, res) => {

  const currentUser = await getCurrentUser();
  const countries = await checkVisisted();
  if (!currentUser) {
    return res.render("index.ejs", {
      countries: [],
      total: 0,
      users: [],
      color: "gray", // Default color when no users exist
    });
  }
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"]; // Move this to the top

  // Prevent empty input or whitespace-only values
  if (!input || input.trim() === "") {
    console.log("Invalid country input.");
    return res.redirect("/");
  }

  const currentUser = await getCurrentUser();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.log("No matching country found for input:", input);
      return res.redirect("/");
    }

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log("Error inserting visited country:", err);
      res.redirect("/");
    }
  } catch (err) {
    console.log("Error querying country:", err);
    res.redirect("/");
  }
});

app.post("/delete-user", async (req, res) => {
  const userId = req.body.user;

  try {
    // Delete user's visited countries first (to maintain foreign key integrity)
    await db.query("DELETE FROM visited_countries WHERE user_id = $1;", [userId]);

    // Delete the user from the database
    await db.query("DELETE FROM users WHERE id = $1;", [userId]);

    console.log(`User with ID ${userId} deleted.`);
    
    // Reset current user if deleted user was active
    if (currentUserId == userId) {
      currentUserId = users.length > 0 ? users[0].id : null;
    }

    res.redirect("/");
  } catch (err) {
    console.log("Error deleting user:", err);
    res.redirect("/");
  }
});



app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
