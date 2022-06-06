const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
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



async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}

async function getRandomRecipiesDetails() {
    let recipe_info = await getRandomRecipies();
    let recipes = []
    recipes[0] = {
        id:recipe_info.data.recipes[0].id,
        title: recipe_info.data.recipes[0].title,
        readyInMinutes: recipe_info.data.recipes[0].readyInMinutes,
        image: recipe_info.data.recipes[0].image,
        popularity: recipe_info.data.recipes[0].aggregateLikes,
        vegan: recipe_info.data.recipes[0].vegan,
        vegetarian: recipe_info.data.recipes[0].vegetarian,
        glutenFree: recipe_info.data.recipes[0].glutenFree,
        
    }
    recipes[1] = {
        id:recipe_info.data.recipes[1].id,
        title: recipe_info.data.recipes[1].title,
        readyInMinutes: recipe_info.data.recipes[1].readyInMinutes,
        image: recipe_info.data.recipes[1].image,
        popularity: recipe_info.data.recipes[1].aggregateLikes,
        vegan: recipe_info.data.recipes[1].vegan,
        vegetarian: recipe_info.data.recipes[1].vegetarian,
        glutenFree: recipe_info.data.recipes[1].glutenFree,
        
    }
    recipes[2] = {
        id:recipe_info.data.recipes[2].id,
        title: recipe_info.data.recipes[2].title,
        readyInMinutes: recipe_info.data.recipes[2].readyInMinutes,
        image: recipe_info.data.recipes[2].image,
        popularity: recipe_info.data.recipes[2].aggregateLikes,
        vegan: recipe_info.data.recipes[2].vegan,
        vegetarian: recipe_info.data.recipes[2].vegetarian,
        glutenFree: recipe_info.data.recipes[2].glutenFree,
        
    }
    return recipes

}




exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipiesDetails = getRandomRecipiesDetails;



