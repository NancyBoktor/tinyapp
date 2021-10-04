const bcrypt = require("bcryptjs");

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
  return null;
};

// check password with the hash password
const truePassword = (password, userDbPassword) => {
  if (bcrypt.compareSync(password, userDbPassword)) {
    return true;
  }
  return false;
};

// get url by user ID
const getURLSByUser = (userID, urlDatabase) => {
  const urls = {};
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === userID) {
      urls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return urls;
};

// check if url own to user id
const isOwnUrl = (userID, url, urlDatabase) => {
  const userUrls = getURLSByUser(userID, urlDatabase);
  return Object.keys(userUrls).some((u) => url === u);
};

// check shourt url is in db
const isExist = (url, urlDatabase) => {
  return Object.keys(urlDatabase).some((u) => url === u);
};

module.exports = {
  generateRandomString,
  findUserByEmail,
  truePassword,
  getURLSByUser,
  isOwnUrl,
  isExist,
};
