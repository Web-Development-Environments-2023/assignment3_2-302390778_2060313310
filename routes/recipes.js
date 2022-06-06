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
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
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
  const recipe = await recipes_utils.getRandomRecipiesDetails();
  res.status(200).send({ message: recipe, success: true });
});


/**
 * This path add recipe to DB
 */
router.post("/addRecipe", async (req, res, next) => {
  try{
    let recipe = {
      name: req.body.name,
      timeToMake: req.body.timeToMake,
      whoCanEatVegOrNot: req.body.whoCanEatVegOrNot,
      glutenFree:req.body.glutenFree,
      ingridients: req.body.ingridients,
      instructions: req.body.instructions,
      numberOfMeals: req.body.numberOfMeals
    }
    let maxID = 0;
    maxID = await DButils.execQuery("SELECT MAX(id) from recipes;")
    await DButils.execQuery(
      `INSERT INTO recipes VALUES ('${maxID[0]['MAX(id)']+1}','${recipe.name}','${recipe.timeToMake}', '${0}', '${recipe.whoCanEatVegOrNot}', '${recipe.glutenFree}',
      '${recipe.ingridients}', '${recipe.instructions}', '${recipe.numberOfMeals}', '${""}')`
      );
    res.status(201).send({ message: "recipe was added", success: true });
  }
  catch (error) {
    next(error);
    res.status(403).send({ message: "couldn`t add recipe to DB", success: false });
  }
});


module.exports = router;
