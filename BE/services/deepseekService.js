const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function consultarDeepSeek(mensajes, herramientasDisponibles = []) {
    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            throw new Error("DEEPSEEK_API_KEY no está configurada en el archivo .env");
        }

        const payload = {
            model: "deepseek-chat",
            messages: mensajes,
            temperature: 0.2,
        };

        if (herramientasDisponibles.length > 0) {
            payload.tools = herramientasDisponibles;
            payload.tool_choice = "auto";
        }

        const response = await axios.post(DEEPSEEK_API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        // Retorna la respuesta completa del asistente
        return response.data.choices[0].message;

    } catch (error) {
        console.error('Error al comunicarse con la API de DeepSeek:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { consultarDeepSeek };
