const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const MongoDBSession = require("connect-mongodb-session")(session);
const app = express();

const UserModel = require("./Models/User");

const MongoURI = "mongodb://127.0.0.1:27017/sessions"

mongoose.connect(MongoURI)
.then(res =>{
    console.log("MongoDB is Connected");
}).catch(err => {console.log(err)})

const store = new MongoDBSession({
    uri : MongoURI,
    collection : "mySessions",
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended : true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret : "my secret",
    resave : false,
    saveUninitialized : false,
    store : store,
}));

const isAuth = (req, res, next) =>{
    if(req.session.isAuth){
        next();
    } else{
        res.redirect("/login");
    }
}

app.get("/", (req, res)=>{
    res.render("landing.ejs");
});

app.get("/login", (req, res)=>{
    res.render("login.ejs");
});
app.post("/login", async (req, res)=>{
    let { email, password } = req.body;

    let user = await UserModel.findOne({email});

    if(!user){
        return res.redirect("/login");
    };

    const isMatch = await bcrypt.compareSync(password, user.password);

    if(!isMatch){
        return res.redirect("/login");
    }
    req.session.isAuth = true;
    res.redirect("/dashbord");
});

app.get("/register", (req, res)=>{
    res.render("register.ejs");
});

app.post("/register", async (req, res)=>{
    let { username, email, password } = req.body;
    let user = await UserModel.findOne({email});

    if(user){
        return res.redirect("/register");
    }

    let hashPass = bcrypt.hashSync(password, 12);

    user = new UserModel({
        username,
        email,
        password : hashPass,
    });

    await user.save();

    res.redirect("/login");
});

app.get("/dashbord", isAuth, (req, res)=>{
    res.render("dashbord.ejs");
});

app.post("/logout", (req, res)=>{
    req.session.destroy(err =>{
        if(err) throw err;
        res.redirect("/");
    })
})

app.listen(5000, ()=>{
    console.log("Server Running on http://localhost:5000");
});