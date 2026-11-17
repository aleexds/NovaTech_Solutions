const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // O endpoint oficial de DeepSeek

async function consultarDeepSeek(mensajes, herramientasDisponibles = []) {
    try {
        if (!DEEPSEEK_API_KEY) {
            throw new Error("DEEPSEEK_API_KEY no está configurada en el archivo .env");
        }

        const payload = {
            model: "deepseek-chat", // O deepseek-reasoner según tu preferencia
            messages: mensajes,
            temperature: 0.2,
        };

        if (herramientasDisponibles.length > 0) {
            payload.tools = herramientasDisponibles;
            payload.tool_choice = "auto";
        }

        const response = await axios.post(DEEPSEEK_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            }
        });

        return response.data.choices[0].message;
    } catch (error) {
        console.error('Error al comunicarse con la API de DeepSeek:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { consultarDeepSeek };