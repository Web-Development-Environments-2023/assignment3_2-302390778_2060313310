var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  console.log(req.session)
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


// ------------> POST requests

/**
 * This path save user recipe
 */
 router.post("/addUserRecipe", async (req, res, next) => {
  const succeeded = await user_utils.addRecipe(req.body,req.session.user_id);
  if (succeeded)
    res.status(201).send({ message: "recipe was added", success: true });
  else
    res.status(403).send({ message: "couldn`t add recipe to DB", success: false });
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/addFavorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    console.log(user_id)
    console.log(recipe_id)
    alresdyLiked = await DButils.execQuery(`SELECT * from FavoriteRecipes where user_id = ${user_id} and recipe_id = ${recipe_id}`);
    if (alresdyLiked.length == 1)
      throw { status: 403, message: "User already markd this recipe as favorite!" };
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})



// ------------> GET requests

/**
 * This path returns the last searched recipe by logged in user.
 */
router.get('/lastSearch', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const results = await user_utils.getLastSearch(user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

/**
 * This path returns the 3 last watch recipes that were whatched by the logged-in user
 */
 router.get('/threelastWatched', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipes_ids = await user_utils.getThreelastWatched(user_id);
    const results = await recipe_utils.getRecipesDetails(recipes_ids,user_id)
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
 router.get('/getFavorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    console.log(user_id)
    const recipes_ids = await user_utils.getFavoriteRecipes(user_id);
    const results = await recipe_utils.getRecipesDetails(recipes_ids,user_id)
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


/**
 * This path get all user recipes
 */
router.get('/getUserRecipe', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const results = await user_utils.getUserRecipes(user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


/**
 * This path get all family recipes
 */
router.get('/familyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const results = await user_utils.getFamilyRercipe(user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


router.get("/getLocalRecipeFromClick", async (req, res, next) => {
  try{
  const recipe = await recipes_utils.getLocalFullRecipe(parseInt(req.query.recipeId),req.session.user_id);
  res.status(200).send({ message: recipe, success: true });
  }
  catch(error){
    res.status(404).send({ message: "recipe id not found", success: false });
  }
});






module.exports = router;
