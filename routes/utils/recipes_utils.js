const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const MySql = require("../utils/MySql");
const DButils = require("../utils/DButils");
const { promise } = require("bcrypt/promises");


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipeId) {
    return await axios.get(`${api_domain}/${recipeId}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRandomRecipies() {
    return await axios.get(`${api_domain}/random`, {
        params: {
            limitLicense: true,
            number:3,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function searchRecipe(query,amount,cuisine,diet,intolerances) {
    return await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: query,
            number:amount,
            limitLicense: true,
            cuisine: cuisine,
            diet: diet,
            intolerances: intolerances,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function mapRecipesDetails(recipeInfo,userId){
    let userHasWatch;
    const userWatch = await DButils.execQuery(`select user_id from userHasWatch where user_id='${userId}'`)
    if (userWatch.length < 1)
        userHasWatch = false;
    else
        userHasWatch = true;
    let favoriterecipes;
    const userFavorite = await DButils.execQuery(`select user_id from favoriterecipes where user_id='${userId}'`)
    if (userFavorite.length < 1)
        favoriterecipes = false;
    else
        favoriterecipes = true;
    return {
        id:recipeInfo.id,
        title: recipeInfo.title,
        readyInMinutes: recipeInfo.readyInMinutes,
        image: recipeInfo.image,
        popularity: recipeInfo.aggregateLikes,
        vegan: recipeInfo.vegan,
        vegetarian: recipeInfo.vegetarian,
        glutenFree: recipeInfo.glutenFree,
        wasWatchedByUserBefore: userHasWatch,
        wasSavedByUser: favoriterecipes,
    }
}

async function getRecipeDetails(recipeId,userId) {
    let recipeInfo = await getRecipeInformation(recipeId);
    const final_list = await Promise.all( [recipeInfo.data].map(function(x){return mapRecipesDetails(x,userId);}));
    return final_list;
}


async function getRandomRecipiesDetails(userId) {
    let recipeInfo = await getRandomRecipies();
    const final_list = await Promise.all( recipeInfo.data.recipes.map(function(x){return mapRecipesDetails(x,userId);}));
    return final_list;

}

async function addRecipe(reqBody){
    try{
        let recipe = {
        name: reqBody.name,
        timeToMake: reqBody.timeToMake,
        whoCanEatVegOrNot: reqBody.whoCanEatVegOrNot,
        glutenFree:reqBody.glutenFree,
        ingridients: reqBody.ingridients,
        instructions: reqBody.instructions,
        numberOfMeals: reqBody.numberOfMeals
        }
        let maxID = 0;
        maxID = await DButils.execQuery("SELECT MAX(id) from recipes;")
        await DButils.execQuery(
        `INSERT INTO recipes VALUES ('${maxID[0]['MAX(id)']+1}','${recipe.name}','${recipe.timeToMake}', '${0}', '${recipe.whoCanEatVegOrNot}', '${recipe.glutenFree}',
        '${recipe.ingridients}', '${recipe.instructions}', '${recipe.numberOfMeals}', '${""}')`
        );
        return true;
    }
    catch (error) {
        return false;
    }
}

async function updateThreeLastWatches(user_id, rep_id){
    if (user_id == null) {return;}
    let threeRecipes = await DButils.execQuery(`select * from threeLastWatchesRecipes where user_id='${user_id}'`)
    let rep1 = threeRecipes[0].recipe_id_1;
    let rep2 = threeRecipes[0].recipe_id_2;
    let rep3 = threeRecipes[0].recipe_id_3;
    let new_rep1;
    let new_rep2;
    let new_rep3;
    switch(rep_id) {
        case rep3:
            new_rep1 = rep3
            new_rep2 = rep1
            new_rep3 = rep2
            break;
        case rep2:
            new_rep1 = rep2
            new_rep2 = rep1
            new_rep3 = rep3
            break;
        case rep1:
            new_rep1 = rep1
            new_rep2 = rep2
            new_rep3 = rep3
            break;
        default:
            new_rep1 = rep_id
            new_rep2 = rep1
            new_rep3 = rep2
            break;
      }
      let q = `UPDATE threeLastWatchesRecipes SET recipe_id_1 = ${new_rep1}, recipe_id_2 = ${new_rep2}, recipe_id_3 = ${new_rep3} WHERE user_id = ${user_id};`
      await DButils.execQuery(q)
}


async function getFullRecipe(recipeId,userId){
    let recipeInfo = await getRecipeInformation(String(recipeId));
    let { id, title, readyInMinutes, aggregateLikes, vegan,vegetarian, glutenFree,instructions,servings,extendedIngredients } = recipeInfo.data;
    let userHasWatch = true;
    const userWatch = await DButils.execQuery(`select user_id from userHasWatch where user_id='${userId}' and recipe_id='${recipeId}'`)
    if (userWatch.length < 1 && userId != null){
        await DButils.execQuery(`INSERT INTO userHasWatch VALUES ('${userId}','${recipeId}')`)
    }
    await updateThreeLastWatches(userId, recipeId)
    let favoriterecipes = true;
    const userFavorite = await DButils.execQuery(`select user_id from favoriterecipes where user_id='${userId}'`)
    if (userFavorite.length < 1)
        favoriterecipes = false;
    return {
        id: id,
        name: title,
        timeToMake: readyInMinutes,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        wasWatchedByUserBefore: userHasWatch,
        wasSavedByUser: favoriterecipes,
        glutenFree: glutenFree,
        ingridients: extendedIngredients,
        instructions: instructions,
        numberOfMeals: servings
        
    }
}

async function getSearchRecipe(req,userId){
    let recipesInfo = await searchRecipe(req.query,parseInt(req.amount),req.cuisine,req.diet,req.intolerances);
    recipesInfo = recipesInfo.data.results.map(x => x.id)
    let final_list = []
    for (let i = 0; i < recipesInfo.length; i++){
        let recipeInfo = await getRecipeInformation(recipesInfo[i]);
        final_list.push(await Promise.all( [recipeInfo.data].map(function(x){return mapRecipesDetails(x,userId);})));
    }
    return final_list;
}




exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipiesDetails = getRandomRecipiesDetails;
exports.addRecipe = addRecipe;
exports.getFullRecipe = getFullRecipe;
exports.getSearchRecipe = getSearchRecipe



