const express = require("express");

const app = express();

const PORT = 8080;

// using ejs templare.
app.set("view engine", "ejs");

// url database
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// user database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "mario@mario.com",
    password: "123",
  },
};

const bodyParser = require("body-parser");

const cookieParser = require("cookie-parser");

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));

// helper function to generate random string
const generateRandomString = () => {
  const random = Math.random().toString(26).substring(2, 8);
  return random;
};

// helper function find user by name
const findUserByEmail = (email, users) => {
  let user = {};
  for (let userID in users) {
    if (users[userID].email === email) {
      user = users[userID];
      return user;
    }
  }
  return false;
};

// check password
const truePassword = (password, userDb) => {
  return password === userDb.password;
};

// endpoint
app.get("/urls", (req, res) => {
  const userid = req.cookies["user_id"];

  if (!userid) {
    return res.redirect("/login");
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[userid],
  };

  res.render("urls_index", templateVars);
});

// 1- post the form
// 2- extract the data from the body of the request && creat a random string to the shortURLId.
// 3- insert the data in to db if it was new added and if it exsist we will get the shortURL for it.
// 4- redirect shortURLId to urls list and the bowser will get resp from there.
// 5- res.redirect to longURL

app.get("/urls/new", (req, res) => {
  const userid = req.cookies["user_id"];

  if (userid) {
    const templateVars = { user: users[userid] };
    return res.render("urls_new", templateVars);
  }
  return res.redirect("/login");
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURLId = generateRandomString();
  urlDatabase[shortURLId] = longURL;
  res.redirect(`/urls/${shortURLId}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// route
app.get("/urls/:shortURL", (req, res) => {
  const userid = req.cookies.user_id;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[userid],
  };

  res.render("urls_show", templateVars);
});

// Deleting Url
app.post("/urls/:shortURL/delete", (req, res) => {
  const userid = req.cookies.user_id;

  const url = req.params.shortURL;

  const templateVars = {
    urls: urlDatabase,
    user: users[userid],
  };

  delete urlDatabase[url];

  res.render("urls_index", templateVars);
});

// updating an exist longURL
app.post("/urls/:id", (req, res) => {
  const userid = req.cookies.user_id;
  const shortUrlId = req.params.id;
  const newURL = req.body.newUrl;

  urlDatabase[shortUrlId] = newURL;

  const templateVars = {
    longURL: urlDatabase[shortUrlId],
    shortURL: shortUrlId,
    user: users[userid],
  };

  res.render("urls_show", templateVars);
});

//Register route
app.get("/register", (req, res) => {
  const templateVars = { user: null };

  res.render("urls_register", templateVars);
});

// register POST
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const emailFound = findUserByEmail(email, users);
  const userDb = emailFound;
  const passwordFound = truePassword(password, userDb);

  if (email === "") {
    res.status(400);

    return;
  } else if (emailFound) {
    if (passwordFound) {
      return res.status(400).send("Sorry, that user already exists!");
    } else if (!passwordFound) {
      return res.send("un correct password");
    }
  } else {
    let userid = generateRandomString();
    users[userid] = {
      id: userid,
      email,
      password,
    };

    res.cookie("user_id", userid);

    res.redirect("/urls");
  }
});

//Login route
app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("urls_login", templateVars);
});

// login POST
app.post("/login", (req, res) => {
  let { email, password } = req.body;
  const emailFound = findUserByEmail(email, users);
  const userDb = emailFound;
  const passwordFound = truePassword(password, userDb);
  if (emailFound && passwordFound) {
    res.cookie("user_id");
    return res.redirect("/urls");
  }
  // res.redirect("/login");
  res.send("uncorrect password");
});

//logout POST
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// server is listenning
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
