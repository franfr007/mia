// AI API UNIFICADA - Gestiona Gemini y DeepSeek
class AIManager {
    constructor() {
        this.geminiAPI = null;
        this.deepseekAPI = null;
        this.activeAPI = null;
        this.provider = null;
    }

    // Inicializar con las API keys disponibles
    initialize(geminiKey = null, deepseekKey = null) {
        // Configurar Gemini si hay key
        if (geminiKey) {
            this.geminiAPI = new GeminiAPI();
            this.geminiAPI.setApiKey(geminiKey);
            console.log('✅ Gemini API configurada');
        }

        // Configurar DeepSeek si hay key
        if (deepseekKey) {
            this.deepseekAPI = new DeepSeekAPI();
            this.deepseekAPI.setApiKey(deepseekKey);
            console.log('✅ DeepSeek API configurada');
        }

        // Determinar cuál usar por defecto
        if (this.geminiAPI && this.deepseekAPI) {
            // Si hay ambas, permitir que el usuario elija
            this.activeAPI = this.geminiAPI; // Por defecto Gemini
            this.provider = 'gemini';
            console.log('📌 Ambas APIs disponibles. Usando Gemini por defecto.');
        } else if (this.geminiAPI) {
            this.activeAPI = this.geminiAPI;
            this.provider = 'gemini';
            console.log('📌 Usando Gemini API');
        } else if (this.deepseekAPI) {
            this.activeAPI = this.deepseekAPI;
            this.provider = 'deepseek';
            console.log('📌 Usando DeepSeek API');
        } else {
            console.error('❌ No hay API keys configuradas');
        }

        return this.provider;
    }

    // Cambiar el proveedor activo
    setProvider(provider) {
        if (provider === 'gemini' && this.geminiAPI) {
            this.activeAPI = this.geminiAPI;
            this.provider = 'gemini';
            console.log('🔄 Cambiado a Gemini API');
            return true;
        } else if (provider === 'deepseek' && this.deepseekAPI) {
            this.activeAPI = this.deepseekAPI;
            this.provider = 'deepseek';
            console.log('🔄 Cambiado a DeepSeek API');
            return true;
        } else {
            console.error(`❌ ${provider} no está disponible`);
            return false;
        }
    }

    // Obtener proveedor activo
    getProvider() {
        return this.provider;
    }

    // Verificar qué APIs están disponibles
    getAvailableProviders() {
        const providers = [];
        if (this.geminiAPI) providers.push('gemini');
        if (this.deepseekAPI) providers.push('deepseek');
        return providers;
    }

    // === MÉTODOS DELEGADOS ===
    // Todos los métodos delegan a la API activa

    limpiarMarkdown(texto) {
        return this.activeAPI?.limpiarMarkdown(texto) || texto;
    }

    async call(prompt, options = {}) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.call(prompt, options);
    }

    async analizarTrabajo(contenido, materia, criterios = '', materiaEspecifica = '', nombreEstudiante = '') {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.analizarTrabajo(contenido, materia, criterios, materiaEspecifica, nombreEstudiante);
    }

    async sugerirMejoras(contenido, contexto = '') {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.sugerirMejoras(contenido, contexto);
    }

    async generarRubrica(tema, criterios = []) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.generarRubrica(tema, criterios);
    }

    async generarMensajeForo(titulo, tema, tipo = 'pregunta') {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.generarMensajeForo(titulo, tema, tipo);
    }

    async generarPreguntas(tema, cantidad = 5, tipo = 'multiple-choice') {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.generarPreguntas(tema, cantidad, tipo);
    }

    async analizarParticipacion(actividades) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.analizarParticipacion(actividades);
    }

    async resumirContenido(texto, longitud = 'corto') {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.resumirContenido(texto, longitud);
    }

    async traducirYSimplificar(texto, nivelDestino = 'secundario') {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.traducirYSimplificar(texto, nivelDestino);
    }

    async analizarSimilitud(texto1, texto2) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.analizarSimilitud(texto1, texto2);
    }

    async generarFeedbackPersonalizado(estudiante, contexto) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        return await this.activeAPI.generarFeedbackPersonalizado(estudiante, contexto);
    }

    // Métodos adicionales de Gemini (si existen)
    async generarContenidoPagina(...args) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        if (this.activeAPI.generarContenidoPagina) {
            return await this.activeAPI.generarContenidoPagina(...args);
        }
        throw new Error('Método no disponible en la API actual');
    }

    async generarEtiqueta(...args) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        if (this.activeAPI.generarEtiqueta) {
            return await this.activeAPI.generarEtiqueta(...args);
        }
        throw new Error('Método no disponible en la API actual');
    }

    async analizarPreguntaIndividual(...args) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        if (this.activeAPI.analizarPreguntaIndividual) {
            return await this.activeAPI.analizarPreguntaIndividual(...args);
        }
        throw new Error('Método no disponible en la API actual');
    }

    async analizarCuestionario(...args) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        if (this.activeAPI.analizarCuestionario) {
            return await this.activeAPI.analizarCuestionario(...args);
        }
        throw new Error('Método no disponible en la API actual');
    }

    async moderarDiscusion(...args) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        if (this.activeAPI.moderarDiscusion) {
            return await this.activeAPI.moderarDiscusion(...args);
        }
        throw new Error('Método no disponible en la API actual');
    }

    async generarRespuestaForo(...args) {
        if (!this.activeAPI) {
            throw new Error('No hay API configurada');
        }
        if (this.activeAPI.generarRespuestaForo) {
            return await this.activeAPI.generarRespuestaForo(...args);
        }
        throw new Error('Método no disponible en la API actual');
    }
}

// Instancia global
const aiAPI = new AIManager();

// Alias para compatibilidad con código existente
const geminiAPI = aiAPI;
