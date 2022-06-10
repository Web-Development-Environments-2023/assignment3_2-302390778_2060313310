var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");

router.get("/", (req, res) => res.send("im here"));



// ------------> GET requests

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/getRecipeDescription/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipesDetails(req.params.recipeId,req.session.user_id);
    res.status(201).send({ message: recipe, success: true });
  } catch (error) {
    res.status(404).send({ message: "recipe id not found", success: false });
    // next(error);
  }
});


/**
 * This path returns a 3 full details of random recipes 
 */
router.get("/getRandomRecipes", async (req, res, next) => {
  try{
    const recipe = await recipes_utils.getRandomRecipiesDetails(req.session.user_id);
    res.status(200).send({ message: recipe, success: true });
  }
  catch(error){
    res.status(404).send({ message: "recipe id not found", success: false });
  }
});



/**
 * This path returns a full details of recipe by that was clicked by user
 */
 router.get("/getRecipeFromClick", async (req, res, next) => {
  try{
  const recipe = await recipes_utils.getFullRecipe(parseInt(req.query.recipeId),req.session.user_id);
  res.status(200).send({ message: recipe, success: true });
  }
  catch(error){
    res.status(404).send({ message: "recipe id not found", success: false });
  }
});

/**
 * This path search for X recipes by a given query, when X is anmount that depaneds on the use- 5/10/15 
 */
 router.get("/searchForRecipe", async (req, res, next) => {
   try{
  const recipe = await recipes_utils.getSearchRecipe(req.query,req.session.user_id);
  res.status(200).send({ message: recipe, success: true });
   }
   catch(error){
    res.status(403).send({ message: "wrong query", success: false });
   }
});





module.exports = router;
