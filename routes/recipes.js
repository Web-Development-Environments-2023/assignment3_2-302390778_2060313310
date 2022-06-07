var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/getRecipeDescription/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId,req.session.user_id);
    res.status(201).send({ message: recipe, success: true });
  } catch (error) {
    next(error);
    res.status(404).send({ message: "recipe id not found", success: false });
  }
});

/**
 * This path returns a 3 full details of random recipes 
 */
router.get("/getRandomRecipes", async (req, res, next) => {
  const recipe = await recipes_utils.getRandomRecipiesDetails(req.session.user_id);
  res.status(200).send({ message: recipe, success: true });
});


/**
 * This path returns a 3 full details of random recipes 
 */
 router.get("/getRecipeFromClick", async (req, res, next) => {
  const recipe = await recipes_utils.getFullRecipe(req.params.recipeId,req.session.user_id);
  res.status(200).send({ message: recipe, success: true });
});


/**
 * This path add recipe to DB
 */
router.post("/addRecipe", async (req, res, next) => {
  const succeeded = await recipes_utils.addRecipe(req.body);
  if (succeeded)
    res.status(201).send({ message: "recipe was added", success: true });
  else
    res.status(403).send({ message: "couldn`t add recipe to DB", success: false });
});




module.exports = router;
