var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");




// ------------> POST requests

/**
 * This path handle registerations request
 */
router.post("/Register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
    // username exists
    let user_details = {
      userName: req.body.userName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email
    }
    let users = [];
    users = await DButils.execQuery("SELECT username from users");
    if (users.find((x) => x.username === user_details.userName))
      throw { status: 409, message: "Username taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    let maxID = 0;
    maxID = await DButils.execQuery("SELECT MAX(user_id) from users;")
    let user_id = maxID[0]['MAX(user_id)']+1;
    await DButils.execQuery(
      `INSERT INTO users VALUES ('${user_id}','${user_details.userName}', '${user_details.firstName}', '${user_details.lastName}',
      '${user_details.country}', '${hash_password}', '${user_details.email}')`
    );
    await DButils.execQuery(
      `INSERT INTO threeLastWatchesRecipes VALUES ('${user_id}',null, null, null)`
    );

    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});


/**
 * This path authenticate the logged-in user details, and set the cookie
 */
router.post("/Login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT userName FROM users");
    if (!users.find((x) => x.userName === req.body.userName))
      throw { status: 401, message: "Username or Password incorrect" };
    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${req.body.userName}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    // Set cookie
    req.session.user_id = user.user_id;


    // return cookie
    res.status(200).send({ message: "login succeeded", success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * This path log out the session user, if he logged-in
 */
router.post("/Logout", function (req, res) {
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;