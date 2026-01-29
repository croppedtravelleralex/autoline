import axios from 'axios';
import type { SystemSettings, Recipe } from '../types/settings';

// Assuming API is at localhost:8001/api if not configured otherwise (CORS enabled)
const API_BASE_URL = '/api';

export const SettingsService = {
    async getSettings(): Promise<SystemSettings> {
        const response = await axios.get<SystemSettings>(`${API_BASE_URL}/settings`);
        return response.data;
    },

    async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
        const response = await axios.post<SystemSettings>(`${API_BASE_URL}/settings`, settings);
        return response.data;
    },

    async getRecipes(): Promise<Recipe[]> {
        const response = await axios.get<Recipe[]>(`${API_BASE_URL}/recipes`);
        return response.data;
    },

    async createRecipe(recipe: Recipe): Promise<Recipe> {
        const response = await axios.post<Recipe>(`${API_BASE_URL}/recipes`, recipe);
        return response.data;
    },

    async updateRecipe(recipe: Recipe): Promise<Recipe> {
        const response = await axios.put<Recipe>(`${API_BASE_URL}/recipes/${recipe.id}`, recipe);
        return response.data;
    },

    async deleteRecipe(recipeId: string): Promise<void> {
        await axios.delete(`${API_BASE_URL}/recipes/${recipeId}`);
    }
};
