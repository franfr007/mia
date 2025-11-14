// DEEPSEEK API - Funciones de IA
class DeepSeekAPI {
    constructor() {
        this.apiKey = 'sk-cba9755f54d246d39fdd24421c8ee1ca';
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-chat';
    }

    // Actualizar API key
    setApiKey(key) {
        this.apiKey = key;
    }

    // Limpiar formato Markdown
    limpiarMarkdown(texto) {
        if (!texto) return '';
        
        return texto
            // Quitar separadores ---
            .replace(/^---+$/gm, '')
            // Quitar encabezados ### ## #
            .replace(/^#{1,6}\s+/gm, '')
            // Quitar negritas *** y **
            .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            // Quitar cursivas *
            .replace(/\*(.+?)\*/g, '$1')
            // Limpiar líneas vacías múltiples
            .replace(/\n{3,}/g, '\n\n')
            // Quitar espacios al inicio y final
            .trim();
    }

    // Llamada genérica a DeepSeek
    async call(prompt, options = {}) {
        const {
            temperature = 0.7,
            maxTokens = 2048,
            model = this.model
        } = options;

        try {
            const response = await fetch(
                `${this.baseUrl}/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{
                            role: 'user',
                            content: prompt
                        }],
                        temperature: temperature,
                        max_tokens: maxTokens
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // LOG DETALLADO PARA DEBUG
            console.log('=== RESPUESTA COMPLETA DE DEEPSEEK ===');
            console.log(JSON.stringify(data, null, 2));
            
            // Verificar estructura de respuesta (formato OpenAI)
            if (!data.choices || !data.choices[0]) {
                console.error('❌ No hay choices en la respuesta');
                throw new Error('La respuesta de DeepSeek no tiene el formato esperado. Revisa la consola para más detalles.');
            }

            const choice = data.choices[0];
            console.log('=== CHOICE[0] ===');
            console.log(JSON.stringify(choice, null, 2));

            // Verificar si hay contenido
            if (!choice.message || !choice.message.content) {
                console.error('❌ No hay message.content en choice');
                throw new Error('La respuesta de DeepSeek no contiene contenido. Revisa la consola para más detalles.');
            }

            console.log('✅ Texto recibido:', choice.message.content.substring(0, 200) + '...');
            return choice.message.content;
            
        } catch (error) {
            console.error('Error en DeepSeek API:', error);
            throw error;
        }
    }

    // === ANÁLISIS DE TRABAJOS ===
    async analizarTrabajo(contenido, materia, criterios = '', materiaEspecifica = '', nombreEstudiante = '') {
        // Prompts especializados por materia
        const promptsEspecializados = {
            antropologia: `Eres un profesor especializado en Antropología Filosófica. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Comprensión de los conceptos antropológicos fundamentales (persona, naturaleza humana, libertad, etc.)
2. Calidad argumentativa y desarrollo conceptual
3. Uso apropiado de autores y corrientes antropológicas
4. Estructura y coherencia del ensayo
5. Sugerencias específicas para mejorar

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico. NO des respuestas correctas, sino que guiá al estudiante hacia su propio descubrimiento.`,

            antigua: `Eres un profesor especializado en Historia de la Filosofía Antigua. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Precisión en la exposición de doctrinas filosóficas antiguas (presocráticos, Sócrates, Platón, Aristóteles, helenismo)
2. Contextualización histórica y filosófica adecuada
3. Análisis crítico de las fuentes y textos antiguos
4. Estructura argumentativa del trabajo
5. Sugerencias específicas de mejora

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico. NO des respuestas correctas, sino que guiá al estudiante.`,

            contemporanea: `Eres un profesor especializado en Filosofía Contemporánea. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Comprensión de las problemáticas filosóficas contemporáneas
2. Manejo de autores y corrientes del siglo XX-XXI
3. Capacidad crítica y análisis conceptual
4. Relación entre problemas contemporáneos y tradición filosófica
5. Sugerencias específicas para profundizar

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico. NO des respuestas correctas, sino que orientá al estudiante.`,

            etica: `Eres un profesor especializado en Ética. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Claridad en el planteamiento del problema ético
2. Argumentación moral y uso de teorías éticas (deontología, consecuencialismo, ética de virtudes, etc.)
3. Análisis de casos o dilemas morales (si corresponde)
4. Coherencia entre principios éticos y conclusiones
5. Sugerencias específicas para mejorar el razonamiento moral

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico. NO des respuestas correctas, sino que guiá el razonamiento del estudiante.`,

            metodologia: `Eres un profesor especializado en Metodología de la Investigación en Filosofía. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Claridad en el planteo del problema de investigación
2. Adecuación del marco teórico y metodología
3. Uso correcto de fuentes y referencias bibliográficas
4. Estructura del trabajo de investigación (introducción, desarrollo, conclusiones)
5. Sugerencias metodológicas específicas para mejorar

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico. NO des respuestas correctas, sino que orientá al estudiante en el proceso investigativo.`,

            logica: `Eres un profesor especializado en Lógica Formal. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Corrección en el uso de simbolización lógica
2. Validez de los argumentos presentados
3. Aplicación correcta de reglas de inferencia
4. Claridad en la demostración de teoremas
5. Sugerencias específicas para mejorar

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico. NO des respuestas correctas, sino que guiá al estudiante hacia su propio descubrimiento.`,

            general: `Eres un profesor universitario. Analizá este trabajo de ${nombreEstudiante || 'este estudiante'} y proporcioná feedback constructivo sobre:
1. Comprensión del tema
2. Calidad argumentativa
3. Estructura y organización
4. Uso de fuentes
5. Sugerencias de mejora

Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.). Sé constructivo, educativo y específico.`
        };

        const promptBase = materiaEspecifica && promptsEspecializados[materiaEspecifica] 
            ? promptsEspecializados[materiaEspecifica]
            : `Eres un profesor especializado en ${materia}. Analizá este trabajo estudiantil y proporcioná feedback constructivo. Usá un tono formal académico pero cercano y cordial, dirigiéndote al estudiante con "vos" (tenés, describís, analizás, etc.).`;

        const prompt = `${promptBase}

${criterios ? `CRITERIOS DE EVALUACIÓN:\n${criterios}\n\n` : ''}

TRABAJO DEL ESTUDIANTE:
${contenido}

Proporcioná un análisis detallado, específico y constructivo.`;

        return await this.call(prompt, { maxTokens: 2048 });
    }

    // === SUGERENCIAS DE MEJORA ===
    async sugerirMejoras(contenido, contexto = '') {
        const prompt = `Analizá el siguiente texto académico y proporcioná sugerencias específicas de mejora:

${contexto ? `CONTEXTO: ${contexto}\n\n` : ''}

TEXTO:
${contenido}

Proporcioná sugerencias sobre:
1. Claridad y precisión conceptual
2. Estructura argumentativa
3. Uso de evidencia y ejemplos
4. Redacción y estilo académico
5. Fortalezas a mantener

Sé específico y constructivo. Usá un tono cordial y profesional.`;

        return await this.call(prompt);
    }

    // === GENERACIÓN DE RÚBRICAS ===
    async generarRubrica(tema, criterios = []) {
        const criteriosTexto = criterios.length > 0 
            ? criterios.join('\n- ')
            : 'criterios académicos estándar';

        const prompt = `Genera una rúbrica de evaluación para un trabajo sobre: ${tema}

Criterios a considerar:
- ${criteriosTexto}

Formato de la rúbrica:
Para cada criterio, define 4 niveles: Excelente (10-9), Bueno (8-7), Suficiente (6-5), Insuficiente (4-0)

Proporciona descripciones claras y específicas para cada nivel.`;

        return await this.call(prompt);
    }

    // === GENERACIÓN DE CONTENIDO PARA FOROS ===
    async generarMensajeForo(titulo, tema, tipo = 'pregunta') {
        const tiposPrompt = {
            'pregunta': 'una pregunta de reflexión que invite al pensamiento crítico',
            'debate': 'un tema de debate que presente diferentes perspectivas',
            'anuncio': 'un anuncio informativo claro y profesional',
            'recurso': 'una presentación de un recurso educativo con su utilidad',
            'consulta': 'una consulta académica bien formulada'
        };

        const prompt = `Genera un mensaje inicial para ${tiposPrompt[tipo]} en un foro académico universitario.

TÍTULO: ${titulo}
TEMA: ${tema}

REQUISITOS:
- Extensión: 3-5 párrafos
- Tono: Académico pero accesible
- Estructura clara con introducción y desarrollo
- Invita a la participación de los estudiantes
- Usa formato HTML simple: <p>, <strong>, <em>, <ul>, <li>
- Si es pregunta: plantea la cuestión claramente y motiva respuestas reflexivas
- Si es debate: presenta el tema y diferentes ángulos de análisis
- Si es anuncio: información clara, fecha, hora, lugar (si aplica)
- Si es recurso: explica qué es y por qué es útil
- Si es consulta: formula la duda específicamente

IMPORTANTE: El mensaje debe ser profesional, completo y motivar la participación activa de los estudiantes.

Ejemplo de pregunta de reflexión:
"<p>Estimados estudiantes, quisiera invitarlos a reflexionar sobre una cuestión fundamental en la ética kantiana: <strong>¿Puede una acción ser moralmente correcta si se realiza por inclinación natural y no por deber?</strong></p>

<p>Kant sostiene que el valor moral de una acción reside en la voluntad que la motiva, específicamente cuando actuamos por deber y no por inclinación. Sin embargo, esto plantea interrogantes interesantes: ¿Significa esto que ayudar a alguien porque nos nace hacerlo no tiene valor moral? ¿O estamos interpretando mal la posición kantiana?</p>

<p>Los invito a compartir sus reflexiones considerando:</p>
<ul>
<li>La distinción kantiana entre actuar conforme al deber y actuar por deber</li>
<li>Ejemplos concretos de ambos casos</li>
<li>Sus propias intuiciones morales sobre este tema</li>
</ul>

<p>Espero sus aportes para enriquecer este debate. Recuerden fundamentar sus posiciones y ser respetuosos con las opiniones de sus compañeros.</p>"

Ahora genera el mensaje para:`;

        return await this.call(prompt, { maxTokens: 1500, temperature: 0.7 });
    }

    // === GENERACIÓN DE PREGUNTAS ===
    async generarPreguntas(tema, cantidad = 5, tipo = 'multiple-choice') {
        const tiposPrompt = {
            'multiple-choice': 'opción múltiple con 4 opciones',
            'true-false': 'verdadero/falso',
            'short-answer': 'respuesta corta',
            'essay': 'ensayo'
        };

        const prompt = `Genera ${cantidad} preguntas de tipo ${tiposPrompt[tipo]} sobre:

TEMA: ${tema}

Para cada pregunta proporciona:
- La pregunta
- Las opciones (si aplica)
- La respuesta correcta
- Una explicación breve de por qué es correcta

Formato JSON:
{
  "questions": [
    {
      "text": "...",
      "options": ["a", "b", "c", "d"],
      "correct": "a",
      "explanation": "..."
    }
  ]
}`;

        const response = await this.call(prompt);
        try {
            // Limpiar markdown del JSON
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            return { questions: [], error: 'No se pudo parsear el JSON' };
        }
    }

    // === ANÁLISIS DE PARTICIPACIÓN ===
    async analizarParticipacion(actividades) {
        const prompt = `Analiza la participación del siguiente estudiante:

ACTIVIDADES:
${JSON.stringify(actividades, null, 2)}

Proporciona:

1. NIVEL DE PARTICIPACIÓN: (alto, medio, bajo)

2. PATRONES IDENTIFICADOS: Describe patrones de comportamiento

3. FORTALEZAS: Aspectos positivos de su participación

4. ÁREAS DE MEJORA: Qué podría mejorar

5. RECOMENDACIONES: Sugerencias específicas para el estudiante

6. ALERTA: ¿Hay signos de que el estudiante necesita ayuda? (sí/no y por qué)`;

        return await this.call(prompt);
    }

    // === RESUMEN DE CONTENIDO ===
    async resumirContenido(texto, longitud = 'corto') {
        const longitudMap = {
            'corto': 'máximo 100 palabras',
            'medio': 'máximo 250 palabras',
            'largo': 'máximo 500 palabras'
        };

        const prompt = `Resume el siguiente texto en ${longitudMap[longitud]}:

${texto}

Mantén los puntos clave y la información más importante.`;

        return await this.call(prompt);
    }

    // === TRADUCCIÓN PEDAGÓGICA ===
    async traducirYSimplificar(texto, nivelDestino = 'secundario') {
        const prompt = `Simplifica el siguiente texto para un nivel ${nivelDestino}:

TEXTO ORIGINAL:
${texto}

Instrucciones:
1. Usa vocabulario apropiado para el nivel
2. Mantén la precisión conceptual
3. Agrega ejemplos si es necesario
4. Usa analogías para conceptos complejos`;

        return await this.call(prompt);
    }

    // === DETECCIÓN DE PLAGIO ===
    async analizarSimilitud(texto1, texto2) {
        const prompt = `Analiza la similitud entre estos dos textos:

TEXTO 1:
${texto1}

TEXTO 2:
${texto2}

Proporciona:
1. NIVEL DE SIMILITUD: (alto, medio, bajo)
2. FRASES SIMILARES: Lista frases que se repiten
3. CONCEPTOS COMUNES: Ideas compartidas
4. EVALUACIÓN: ¿Es probable plagio?`;

        return await this.call(prompt);
    }

    // === FEEDBACK PERSONALIZADO ===
    async generarFeedbackPersonalizado(estudiante, contexto) {
        const prompt = `Genera feedback personalizado para:

ESTUDIANTE: ${estudiante.nombre}
HISTORIAL:
${JSON.stringify(estudiante.historial, null, 2)}

CONTEXTO ACTUAL:
${contexto}

Genera un mensaje:
1. Personalizado basado en su historial
2. Que reconozca sus logros
3. Que identifique áreas de mejora
4. Que sea motivador y constructivo
5. Que sugiera próximos pasos específicos

Dirígte al estudiante directamente.`;

        return await this.call(prompt);
    }
}

// Exportar instancia global
const deepseekAPI = new DeepSeekAPI();
