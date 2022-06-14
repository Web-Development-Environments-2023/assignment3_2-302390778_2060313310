const DButils = require("./DButils");



//----------------------> getters functions

/**
 * This function return all the Favorites Recipes of a given user_id.
 */
async function getFavoriteRecipes(user_id){
    const recipes_ids = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    to_ret = []
    for(let i=0;i<recipes_ids.length;i++){
        to_ret[i] = recipes_ids[i].recipe_id
    }  
    return to_ret;
}

/**
 * This function return the 3 last watches recipes of a given user_id.
 */
async function getThreelastWatched(user_id){
    let threeRecipes = await DButils.execQuery(`select * from threeLastWatchesRecipes where user_id=${user_id}`)
    let rep1 = threeRecipes[0].recipe_id_1;
    let rep2 = threeRecipes[0].recipe_id_2;
    let rep3 = threeRecipes[0].recipe_id_3;
    return [rep1,rep2,rep3];
}

/**
 * This function return the last query searched by a given user_id.
 */
async function getLastSearch(userId){
    const lastSearch = await DButils.execQuery(`select query from lastsearch where user_id=${userId}`);
    if (lastSearch.length == 0)
        return [];
    let rep1 = lastSearch[0].query;
    return [rep1];
}

/**
 * This function return all the user recipes of a given user_id.
 */
async function getUserRecipes(userId){
    const userRcipes = await DButils.execQuery(`select * from userRecipes where user_id=${userId}`);
    let to_ret = []
    for(let i=0; i<userRcipes.length; i++){
        let recipe_dict = {}
        recipe_dict['id'] = userRcipes[i].id
        recipe_dict['title'] = userRcipes[i].title
        recipe_dict['readyInMinutes'] = userRcipes[i].readyInMinutes
        recipe_dict['vegan'] = userRcipes[i].vegan
        recipe_dict['vegetarian'] = userRcipes[i].vegetarian
        recipe_dict['glutenFree'] = userRcipes[i].glutenFree
        recipe_dict['extendedIngredients'] = userRcipes[i].extendedIngredients
        recipe_dict['instructions'] = userRcipes[i].instructions
        recipe_dict['servings'] = userRcipes[i].servings
        to_ret[i] = recipe_dict
    }
    return to_ret;
}

/**
 * This function return all the family recipes of a given user_id.
 */
 async function getFamilyRercipe(user_id){
    const userRcipes = await DButils.execQuery(`select * from familyRercipe where user_id=${user_id}`);
    let to_ret = []
    for(let i=0; i<userRcipes.length; i++){
        let recipe_dict = {}
        recipe_dict['id'] = userRcipes[i].id
        recipe_dict['belong_to'] = userRcipes[i].belong_to
        recipe_dict['events_to_cook'] = userRcipes[i].events_to_cook
        recipe_dict['ingredients'] = userRcipes[i].ingredients
        recipe_dict['instructions'] = userRcipes[i].instructions
        recipe_dict['title'] = userRcipes[i].title
        recipe_dict['img'] = userRcipes[i].img
        to_ret[i] = recipe_dict
    }
    return to_ret;
}


//----------------------> setters functions

/**
 * This function add new user recipe of a given user_id.
 */
async function addRecipe(reqBody,userId){
    try{
        let recipe = {
            title: reqBody.title,
            readyInMinutes: reqBody.readyInMinutes,
            vegan: reqBody.vegan,
            vegetarian: reqBody.vegetarian,
            glutenFree: reqBody.glutenFree,
            extendedIngredients: reqBody.extendedIngredients,
            instructions: reqBody.instructions,
            servings: reqBody.servings
        }
        let maxID = 0;
        maxID = await DButils.execQuery("SELECT MAX(id) from userRecipes;")
        await DButils.execQuery(
        `INSERT INTO userRecipes VALUES (${maxID[0]['MAX(id)']+1} ,${userId},'${recipe.title}', ${recipe.readyInMinutes}, '${recipe.vegan}','${recipe.vegetarian}', '${recipe.glutenFree}', '${recipe.extendedIngredients}', '${recipe.instructions}', ${recipe.servings})`
        );
        return true;
    }
    catch (error) {
        return false;
    }
}

/**
 * This function update the FavoriteRecipes table.
 */
 async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
}



exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getThreelastWatched = getThreelastWatched;
exports.getLastSearch = getLastSearch;
exports.getUserRecipes = getUserRecipes;
exports.addRecipe = addRecipe;
exports.getFamilyRercipe = getFamilyRercipe;
