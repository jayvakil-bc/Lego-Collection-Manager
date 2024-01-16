/********************************************************************************
 * WEB322 – Assignment 06
 *
 * Name: Jay Vijaykumar Vakil
 *
 * Published URL: ___________________________________________________________
 *
 ********************************************************************************/
 const legoData = require("./modules/legoSets");
 const authData = require("./modules/auth-service");
 const clientSessions = require('client-sessions');
 const path = require("path");
 const express = require('express');
 const bodyParser = require('body-parser');
 const app = express();
 
 const HTTP_PORT = process.env.PORT || 8080;
 
 app.use(express.static('public'));
 app.use(bodyParser.urlencoded({ extended: true }));
 app.set('view engine', 'ejs');
 
 function validateFormData(name, year, num_parts, img_url, theme_id, set_num) {
   const errors = [];
 
   if (!name || !year || !num_parts || !img_url || !theme_id || !set_num) {
     errors.push("All fields are required");
   }
   return errors;
 }
 
 app.use(
   clientSessions({
     cookieName: 'session',
     secret: 'V91jErNRUtt1yfY2',
     duration: 24 * 60 * 60 * 1000,
     activeDuration: 1000 * 60 * 5,
     cookie: {
       ephemeral: false,
       httpOnly: true,
       secure: false,
     },
   })
 );
 
 function ensureLogin(req, res, next) {
   if (!req.session || !req.session.user) {
     res.redirect('/login');
   } else {
     next();
   }
 }
 
 app.use(express.urlencoded({ extended: true }));
 
 app.use((req, res, next) => {
   res.locals.session = req.session;
   next();
 });
 
 app.get('/', (req, res) => {
   res.render("home");
 });
 
 app.get('/about', (req, res) => {
   res.render("about");
 });
 
 app.get("/lego/sets", async (req, res) => {
   let sets = [];
   try {
     if (req.query.theme) {
       sets = await legoData.getSetsByTheme(req.query.theme);
     } else {
       sets = await legoData.getAllSets();
     }
 
     res.render("sets", { sets });
   } catch (err) {
     res.status(404).render("404", { message: err });
   }
 });
 
 app.get("/lego/sets/:num", async (req, res) => {
   try {
     let set = await legoData.getSetByNum(req.params.num);
     res.render("set", { set });
   } catch (err) {
     res.status(404).render("404", { message: err });
   }
 });
 
 app.get("/lego/addSet", async (req, res) => {
   try {
     const themes = await legoData.getAllThemes();
     res.render("addSet", { themes });
   } catch (err) {
     res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
   }
 });
 
 app.post('/lego/addSet', ensureLogin, async (req, res) => {
   try {
     const { name, year, num_parts, img_url, theme_id, set_num } = req.body;
 
     const validationErrors = validateFormData(name, year, num_parts, img_url, theme_id, set_num);
 
     if (validationErrors.length > 0) {
       const themes = await legoData.getAllThemes();
       return res.status(400).render('addSet', { validationErrors, themes });
     }
     await legoData.addSet({ name, year, num_parts, img_url, theme_id, set_num });
 
     res.redirect('/lego/sets');
   } catch (error) {
     const errorMessage = error.message || 'An unexpected error occurred.';
     res.status(500).render('error', { message: errorMessage });
   }
 });
 
 app.post('/lego/editSet', ensureLogin, async (req, res) => {
   try {
     const { set_num, ...setData } = req.body;
     await legoData.editSet(set_num, setData); 
     res.redirect('/lego/sets');
   } catch (error) {
     res.status(500).render('error', { message: 'An unexpected error occurred.' });
   }
 });
 
 app.get('/lego/deleteSet/:num', async (req, res) => {
   try {
     const setNum = req.params.num;
     await legoData.deleteSet(setNum);
     res.redirect('/lego/sets');
   } catch (err) {
     res.status(500).render('500', { message: `Error deleting set: ${err}` });
   }
 });
 
 app.get('/register', (req, res) => {
   res.render('register', { successMessage: '', userName: '', errorMessage: '' });
 });
 
 app.post("/register", (req, res) => {
   console.log('Request Body:', req.body); 
   authData.RegisterUser(req.body)
     .then(() => {
       res.render("register", { errorMessage: '', successMessage: " ✓ User created.", userName: '' });
     })
     .catch((err) => {
       res.render("register", {
         errorMessage: err,
         userName: req.body.userName,
         successMessage: ""
       });
     });
 });
 
 app.get('/login', (req, res) => {
   res.render('login', { userName: '', errorMessage: '' });
 });
 
 app.post('/login', async (req, res) => {
   try {
     console.log('Request Body:', req.body);
     req.body.userAgent = req.get('User-Agent');
     const user = await authData.checkUser(req.body);
     console.log("\n" + user + "\n");
     if (user) {
       req.session.user = {
         userName: user.userName,
         email: user.email,
         loginHistory: user.loginHistory
       };
       res.redirect("/lego/sets");
       console.log("worked" + "\n");
       console.log(req.session.user);
     } else {
       console.log("not worked" + "\n");
     }
   } catch (err) {
     const errorMessage = err.message || 'An error occurred during login';
     res.render('login', { errorMessage: errorMessage, userName: req.body.userName });
   }
 });
 
 app.get('/logout', (req, res) => {
   req.session.reset();
   res.redirect('/');
 });
 
 app.get('/userHistory', ensureLogin, (req, res) => {
   res.render('userHistory');
 });
 
 app.use((req, res, next) => {
   res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
 });
 
 legoData.initialize()
   .then(authData.initialize)
   .then(function () {
     app.listen(HTTP_PORT, function () {
       console.log(`app listening on: ${HTTP_PORT}`);
     });
   })
   .catch(function (err) {
     console.log(`unable to start server: ${err}`);
   });
 