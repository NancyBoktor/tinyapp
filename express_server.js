const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// using ejs templare.
app.set("view engine", "ejs");
//the data in the post request body is sent as a Buffer(it's not readable for us humans)
//so we install middleware (body-parser) to make the data
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const generateRandomString = () => {
  const random = Math.random().toString(26).substring(2, 8);
  return random;
};
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// 1- post the form
// 2- extract the data from the body of the request && creat a random string to the shortURLId.
// 3- insert the data in to db if it was new added and if it exsist we will get the shortURL for it.
// 4- redirect shortURLId to urls list and the bowser will get resp from there.
// 5- res.redirect to longURL

// 1 //
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  // 2 //
  const longURL = req.body.longURL;
  const shortURLId = generateRandomString();
  // 3 //
  urlDatabase[shortURLId] = longURL;
  // 4 //
  res.redirect(`/urls/${shortURLId}`);
});
// 5 //
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});
// Deleting Url
app.post("/urls/:shortURL/delete", (req, res) => {
  const url = req.params.shortURL;
  const templateVars = { urls: urlDatabase };
  delete urlDatabase[url];
  res.render("urls_index", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
