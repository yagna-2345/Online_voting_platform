const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const db = require("./db");
const mysql = require("mysql");
const path = require("path");
const app = express();
app.use(express.json());
app.use(cors());

// serve frontend folder
app.use(express.static(path.join(__dirname, "frontend")));


/* ===================== REGISTER ===================== */
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
    [name, email, hashedPassword, role],
    (err) => {
      if (err) {
        res.status(400).send("User already exists");
      } else {
        res.send("Registered Successfully");
      }
    }
  );
});

/* ===================== LOGIN ===================== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (result.length === 0) {
        return res.status(404).send("User not found");
      }

      const validPassword = await bcrypt.compare(
        password,
        result[0].password
      );

      if (!validPassword) {
        return res.status(401).send("Invalid password");
      }

      res.json({
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        role: result[0].role
      });
    }
  );
});

/* ===================== ADD CANDIDATE (ADMIN) ===================== */
app.post("/candidate", (req, res) => {
  console.log(req.body); 
  const { name, party, description, image, election_id } = req.body;

  db.query(
    `INSERT INTO candidates (name, party, description, image, election_id)
     VALUES (?,?,?,?,?)`,
    [name, party, description, image, election_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error adding candidate");
      }
      res.send("Candidate added successfully");
    }
  );
});


/* ===================== GET CANDIDATES ===================== */
app.get("/candidates", (req, res) => {
  db.query("SELECT * FROM candidates", (err, data) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }
    res.json(data);
  });
});


/* ===================== CAST VOTE ===================== */
app.post("/vote", (req, res) => {
  const { user_id, candidate_id, election_id } = req.body;

  db.query(
    "INSERT INTO votes (user_id, candidate_id, election_id) VALUES (?,?,?)",
    [user_id, candidate_id, election_id],
    (err) => {
      if (err) {
        return res.send("You have already voted");
      }
      res.send("Vote Casted Successfully");
    }
  );
});

/* ===================== RESULTS ===================== */
app.get("/results", (req, res) => {
  db.query(
    `SELECT candidates.name, COUNT(votes.id) AS votes
     FROM votes
     JOIN candidates ON votes.candidate_id = candidates.id
     GROUP BY candidates.name`,
    (err, data) => {
      res.json(data);
    }
  );
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

/* ===================== SERVER ===================== */
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});