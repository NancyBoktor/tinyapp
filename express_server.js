const express = require("express");
const app = express();
const PORT = 8080;

// require helper functions
const {
  generateRandomString,
  findUserByEmail,
  truePassword,
  getURLSByUser,
  isOwnUrl,
  isExist,
} = require("./helpers");

// using ejs templare.
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
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

app.get("/", (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

// render user's urls if he has created some and he login
app.get("/urls", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(403).send("You should login / register first.");
  }

  const urls = getURLSByUser(userId, urlDatabase);

  const templateVars = {
    user: users[userId],
    urls,
    notExist: Object.keys(urls).length ? "" : "Please create your first url",
  };

  return res.render("urls_index", templateVars);
});

//render the page for creating new shortUrl
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  const templateVars = { user: users[userId] };
  if (!userId) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// user can creat his own shortUrls within this post req
app.post("/urls", (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    return res
      .status(400)
      .send("You need to register or login first! Thank you");
  }

  const longURL = req.body.longURL;

  if (!longURL) {
    return res.status(400).send("You need to pass a longURL!!");
  }

  const shortURLId = generateRandomString();

  urlDatabase[shortURLId] = { longURL, userID };
  res.redirect(`/urls/${shortURLId}`);
});

// pressing on your shortURL within /u/:shortURL sending you to the main page for this shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!isExist(shortURL, urlDatabase)) {
    return res.status(404).send("This url is not exist");
  }
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

//render the user's shortUrl
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.userId;
  const shortURL = req.params.shortURL;
  if (userId === urlDatabase[shortURL].userID) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[userId],
    };
    res.render("urls_show", templateVars);
    return;
  }
  return res.status(404).send("You don't own this shortURL!!!");
});

// user can delete his own shortURLs within this post req
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.userId;
  const url = req.params.shortURL;
  if (!userId) {
    return res
      .status(400)
      .send("You need to register or login first! Thank you");
  }
  if (!isOwnUrl(userId, url, urlDatabase)) {
    return res.status(403).send("You can't access this url");
  }

  delete urlDatabase[url];
  res.redirect("/urls");
});

//when the user want to edit his shortURL
app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res
      .status(400)
      .send("You need to register or login first! Thank you");
  }
  const shortUrlId = req.params.id;

  if (!isOwnUrl(userId, shortUrlId, urlDatabase)) {
    return res.status(403).send("You can't access this url");
  }
  const newURL = req.body.newUrl;
  if (!newURL) {
    return res.status(403).send("You need to pass newURL!!");
  }

  urlDatabase[shortUrlId].longURL = newURL;

  res.redirect("/urls");
});

//render the register page
app.get("/register", (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("urls_register", templateVars);
});

// new user creating his account within this post req
// and creating his cookie
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  const userFound = findUserByEmail(email, users);
  const hashPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("You did not enter email and/or password");
  } else if (userFound) {
    return res.status(400).send("Sorry, that user already exists!");
  } else {
    const userId = generateRandomString();
    users[userId] = {
      id: userId,
      email,
      password: hashPassword,
    };

    req.session.userId = userId;

    res.redirect("/urls");
  }
});

//render the login page
app.get("/login", (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("urls_login", templateVars);
});

//user which has an account able to login within this post req
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email or Password is empty!!");
  }
  const userFound = findUserByEmail(email, users);
  if (!userFound) {
    return res.status(400).send("Email cannot be found!!");
  }
  const passwordFound = truePassword(password, userFound.password);
  if (!passwordFound) {
    return res.status(400).send("wrong password!!");
  }

  req.session.userId = userFound["id"];

  return res.redirect("/urls");
});

//user can logout within this post req
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//server is lisening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
