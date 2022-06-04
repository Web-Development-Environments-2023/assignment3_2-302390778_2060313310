require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("./routes/utils/DButils");
var cors = require('cors')

var app = express();
app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json
app.use(
  session({
    cookieName: "session", // the cookie key name
    //secret: process.env.COOKIE_SECRET, // the encryption key
    secret: "template", // the encryption key
    duration: 24 * 60 * 60 * 1000, // expired after 20 sec
    activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
    cookie: {
      httpOnly: false,
    }
    //the session will be extended by activeDuration milliseconds
  })
);
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
//local:
app.use(express.static(path.join(__dirname, "dist")));
//remote:
// app.use(express.static(path.join(__dirname, '../assignment-3-3-basic/dist')));

// DB connection
const{
  createPool
} = require('mysql')
const DB = createPool({
  host:"localhost",
  user:"root",
  password:"password",
  database:"myrecipe",
  connectionLimit:5
})

// DB.query("select * from users",(err,result,fields)=>{
//   if(err){return console.log(err)}
//   return console.log(result)
// })

app.get("/",function(req,res)
{ 
  //remote: 
  // res.sendFile(path.join(__dirname, '../assignment-3-3-basic/dist/index.html'));
  //local:
  res.sendFile(__dirname+"/index.html");

});

// app.use(cors());
// app.options("*", cors());

const corsConfig = {
  origin: true,
  credentials: true
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

var port = process.env.PORT || "3000"; //local=3000 remote=80
//#endregion
const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth = require("./routes/auth");


//#region cookie middleware
app.use(function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        next();
      })
      .catch((error) => next());
  } else {
    next();
  }
});
//#endregion

// ----> For cheking that our server is alive
app.get("/alive", (req, res) => res.send("I'm alive"));

// Routings
app.use("/users", user);
app.use("/recipes", recipes);
app.use(auth);

// Default router
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

//register
app.post("/users/register", (req, res) => {
  const {
    username,
    firstname,
    lastname,
    country,
    password,
    email,
    profilePic,
  } = req.body;

  let user = {
    id: DB.length,// fix DB to real DB
    username: username,
    firstname: firstname,
    lastname: lastname,
    country: country,
    email: email,
    profilePic: profilePic,
    password: password
  };

  if (DB.find((x) => x.username === user.username)) // fix DB to real DB
    throw { status: 400, message: "username isnt available" };

  DB.push(user); // fix DB to real DB
  res.status(201).send({ message: "user created" });
});

//login
app.post("/users/login", (req, res) => {
  var Luser;
  //check that username exists
  DB.query("select * from users where userName = ?",[req.body.userName],(err,result,fields)=>{
    if(err){return console.log(err)}
    Luser = result[0];
    if (Luser.userName != req.body.userName)
      throw { status: 401, message: "One of the dietalis incorrect" };
    //check that the passwaord is correct
    if (req.body.password === Luser.password) {
      res.status(200).send({ message: "login succedded" });
    } else {
      throw { status: 401, message: "One of the dietalis incorrect" };
    }
  })
})


const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});




process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});
