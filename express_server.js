const express = require("express");
const app = express();
const PORT = 8080;

// using ejs templare.
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// security system using bcryptjs
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

// hash password for users
const hashPassword1 = bcrypt.hashSync("purple-monkey-dinosaur", salt);
const hashPassword2 = bcrypt.hashSync("user2@example.com", salt);
const hashPassword3 = bcrypt.hashSync("123", salt);

// url database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// user database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: hashPassword1,
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashPassword2,
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "mario@mario.com",
    password: hashPassword3,
  },
};

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

// check password with the hash password
const truePassword = (password, userDb) => {
  if (bcrypt.compareSync(password, userDb.password)) {
    return true;
  }
  return false;
};

// get url by user ID
const getURLSByUser = (userID) => {
  const urls = {};

  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === userID) {
      urls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return urls;
};

// endpoint
app.get("/urls", (req, res) => {
  const userid = req.cookies["user_id"];

  if (!userid) {
    return res.redirect("/login");
  }

  const urls = getURLSByUser(userid);

  const templateVars = {
    user: users[userid],
    urls,
    notExist: Object.keys(urls).length ? "" : "Please create your first url",
  };

  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userid = req.cookies["user_id"];

  if (userid) {
    const templateVars = { user: users[userid] };

    return res.render("urls_new", templateVars);
  }

  return res.redirect("/login");
});

// POST
app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];

  const longURL = req.body.longURL;

  const shortURLId = generateRandomString();

  urlDatabase[shortURLId] = { longURL, userID };

  res.redirect(`/urls/${shortURLId}`);
});

//route
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

// route
app.get("/urls/:shortURL", (req, res) => {
  const userid = req.cookies["user_id"];
  console.log(userid);
  if (!userid) {
    return res.redirect("/login");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[userid],
  };

  res.render("urls_show", templateVars);
});

// Deleting Url
app.post("/urls/:shortURL/delete", (req, res) => {
  const url = req.params.shortURL;

  delete urlDatabase[url];

  res.redirect("/urls");
});

// updating an exist longURL
app.post("/urls/:id", (req, res) => {
  const userid = req.cookies.user_id;

  const shortUrlId = req.params.id;

  const newURL = req.body.newUrl;

  urlDatabase[shortUrlId].longURL = newURL;

  const templateVars = {
    longURL: urlDatabase[shortUrlId].longURL,
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

  const userFound = findUserByEmail(email, users);

  const passwordFound = truePassword(password, userFound);

  if (email === "") {
    res.status(400);

    return;
  } else if (userFound) {
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

  const userFound = findUserByEmail(email, users);

  const passwordFound = truePassword(password, userFound);

  if (userFound && passwordFound) {
    res.cookie("user_id", userFound["id"]);

    return res.redirect("/urls");
  }

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
