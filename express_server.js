const express = require("express");
const app = express();
const PORT = 8080;

// using ejs templare.
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//secure by cookieSession
const cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    keys: ["We need to secure our values", "Let us do it!!!!"],
  })
);

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
    userID: "user3RandomID",
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

// require helper functions
const {
  generateRandomString,
  findUserByEmail,
  truePassword,
  getURLSByUser,
  isOwnUrl,
  isExist,
} = require("./helpers");

app.get("/", (req, res) => {
  const userid = req.session.userid;
  if (userid) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userid = req.session.userid;

  if (!userid) {
    return res.status(403).send("You should login / register first.");
  }

  const urls = getURLSByUser(userid, urlDatabase);

  const templateVars = {
    user: users[userid],
    urls,
    notExist: Object.keys(urls).length ? "" : "Please create your first url",
  };

  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userid = req.session.userid;
  const templateVars = { user: users[userid] };
  if (!userid) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session.userid;
  const longURL = req.body.longURL;
  const shortURLId = generateRandomString();
  if (!userID) {
    return res
      .status(400)
      .send("You need to register or login first! Thank you");
  }

  urlDatabase[shortURLId] = { longURL, userID };
  res.redirect(`/urls/${shortURLId}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!isExist(shortURL, urlDatabase)) {
    return res.status(404).send("This url is not exist");
  }
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const userid = req.session.userid;

  if (!userid) {
    return res.status(403).send("You should login / register first.");
  }

  if (!isExist(req.params.shortURL, urlDatabase)) {
    return res.status(404).send("This url is not exist");
  }

  if (!isOwnUrl(userid, req.params.shortURL, urlDatabase)) {
    return res.status(403).send("You can't access this url");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[userid],
  };

  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userid = req.session.userid;
  const url = req.params.shortURL;
  if (!userid) {
    return res
      .status(400)
      .send("You need to register or login first! Thank you");
  }
  if (!isOwnUrl(userid, url, urlDatabase)) {
    return res.status(403).send("You can't access this url");
  }

  delete urlDatabase[url];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const userid = req.session.userid;
  const shortUrlId = req.params.id;

  if (!userid) {
    return res
      .status(400)
      .send("You need to register or login first! Thank you");
  }
  if (!isOwnUrl(userid, shortUrlId, urlDatabase)) {
    return res.status(403).send("You can't access this url");
  }
  const newURL = req.body.newUrl;

  urlDatabase[shortUrlId].longURL = newURL;

  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userid = req.session.userid;
  if (userid) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  const userFound = findUserByEmail(email, users);
  const hashPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("You did not enter email and/or password");
  } else if (userFound) {
    return res.status(400).send("Sorry, that user already exists!");
  } else {
    let userid = generateRandomString();
    users[userid] = {
      id: userid,
      email,
      password: hashPassword,
    };

    req.session.userid = userid;

    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const userid = req.session.userid;
  if (userid) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  let { email, password } = req.body;

  const userFound = findUserByEmail(email, users);
  const passwordFound = truePassword(password, userFound.password);
  if (userFound && passwordFound) {
    req.session.userid = userFound["id"];

    return res.redirect("/urls");
  }

  res.send("uncorrect password");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
