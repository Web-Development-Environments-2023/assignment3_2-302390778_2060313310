const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const MySql = require("../utils/MySql");
const DButils = require("../utils/DButils");
const { promise } = require("bcrypt/promises");
const { NText } = require("mssql");


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


// async function getRecipeInformation(recipeId) {
//     try{
//         return await axios.get(`${api_domain}/${recipeId}/information`, {
//             params: {
//                 includeNutrition: false,
//                 apiKey: process.env.spooncular_apiKey
//             }
//         });
//     }
//     catch(error){
//         next(error);
//     }
// }

async function getRecipesInformation(ids) {
    try{
        return await axios.get(`${api_domain}/informationBulk`, {
            params: {
                ids: ids,
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
            }
        });
    }
    catch(error){
        throw "Failed to get informationBulk api. Error message: " + error.message
    }

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
    if(amount == null) amount = 5;
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

// async function getRecipeDetails(recipeId,userId) {
//     try{
//         let recipeInfo = await getRecipesInformation(recipeId)[0];
//         const final_list = await Promise.all( [recipeInfo.data].map(function(x){return mapRecipesDetails(x,userId);}));
//         return final_list;
    
//     }
//     catch(err){
//         throw err
//     }
// }

async function getRecipesDetails(ids,userId){
    try{
        let string_ids = ""
        let c = ','
        if (typeof ids != "string"){
            ids.forEach(e => {
                if( e === ids[ids.length - 1]){c=''}
                string_ids += String(e) + c
            });
        }
        else{
            string_ids = ids
        }
        
        let recipeInfo = await getRecipesInformation(string_ids);
        const final_list = await Promise.all( recipeInfo.data.map(function(x){return mapRecipesDetails(x,userId);}));
        return final_list;
    }
    
    catch(err){
        throw err
    }
}


async function getRandomRecipiesDetails(userId) {
    let recipeInfo = await getRandomRecipies();
    const final_list = await Promise.all(recipeInfo.data.recipes.map(function(x){return mapRecipesDetails(x,userId);}));
    return final_list;

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

    let recipeInfo = await getRecipesInformation(String(recipeId));
    let { id, title, readyInMinutes, aggregateLikes, vegan,vegetarian, glutenFree,instructions,servings,extendedIngredients } = recipeInfo.data[0];
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
        title: title,
        readyInMinutes: readyInMinutes,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        userHasWatch: userHasWatch,
        favoriterecipes: favoriterecipes,
        glutenFree: glutenFree,
        extendedIngredients: extendedIngredients,
        instructions: instructions,
        servings: servings
    }
}

async function getSearchRecipe(req,userId){
    if(!userId){ await updateLastSearch(req, userId)}
    let recipesInfo = await searchRecipe(req.query,parseInt(req.number),req.cuisine,req.diet,req.intolerances);
    recipesInfo = recipesInfo.data.results.map(x => x.id)
    let string_ids = ""
    let c = ','
    recipesInfo.forEach(e => {
        if( e === recipesInfo[recipesInfo.length - 1]){c=''}
        string_ids += String(e) + c
    });
    let final_list = []
    let recipeInfo = await getRecipesInformation(string_ids);
    final_list.push(await Promise.all( recipeInfo.data.map(function(x){return mapRecipesDetails(x,userId);})));
    return final_list[0];
}

async  function updateLastSearch(req, userId){
    const userWatch = await DButils.execQuery(`select user_id from lastsearch where user_id=${userId}`)
    let q;
    if (userWatch.length > 0){
        q = `UPDATE lastsearch SET query = '${req.query}' WHERE user_id = ${userId};`
        
    }
    else{
        q = `INSERT INTO lastsearch VALUES (${userId},'${req.query}')`
    }
    await DButils.execQuery(q)
}


exports.getRandomRecipiesDetails = getRandomRecipiesDetails;
exports.getFullRecipe = getFullRecipe;
exports.getSearchRecipe = getSearchRecipe;
exports.getRecipesInformation = getRecipesInformation;
exports.getRecipesDetails = getRecipesDetails;



