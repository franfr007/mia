// GEMINI API - Funciones de IA
class GeminiAPI {
    constructor() {
        this.apiKey = moodleAPI.config.geminiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-2.0-flash';
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

    // Llamada genérica a Gemini
    async call(prompt, options = {}) {
        const {
            temperature = 0.7,
            maxTokens = 2048,
            model = this.model
        } = options;

        try {
            const response = await fetch(
                `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature,
                            maxOutputTokens: maxTokens,
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // LOG DETALLADO PARA DEBUG
            console.log('=== RESPUESTA COMPLETA DE GEMINI ===');
            console.log(JSON.stringify(data, null, 2));
            
            // Verificar estructura de respuesta
            if (!data.candidates || !data.candidates[0]) {
                console.error('❌ No hay candidates en la respuesta');
                throw new Error('La respuesta de Gemini no tiene el formato esperado. Revisa la consola para más detalles.');
            }

            const candidate = data.candidates[0];
            console.log('=== CANDIDATE[0] ===');
            console.log(JSON.stringify(candidate, null, 2));

            // Verificar si fue bloqueado por safety filters
            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                console.error('❌ Respuesta bloqueada. Razón:', candidate.finishReason);
                if (candidate.safetyRatings) {
                    console.error('Safety ratings:', candidate.safetyRatings);
                }
                throw new Error(`La respuesta fue bloqueada por filtros de seguridad (${candidate.finishReason}). Intenta reformular la pregunta.`);
            }

            if (!candidate.content || !candidate.content.parts) {
                console.error('❌ No hay content.parts en candidate');
                throw new Error('La respuesta de Gemini no contiene contenido. Revisa la consola para más detalles.');
            }

            if (!candidate.content.parts[0] || !candidate.content.parts[0].text) {
                console.error('❌ No hay text en content.parts[0]');
                throw new Error('La respuesta de Gemini no contiene texto. Revisa la consola para más detalles.');
            }

            console.log('✅ Texto recibido:', candidate.content.parts[0].text.substring(0, 200) + '...');
            return candidate.content.parts[0].text;
            
        } catch (error) {
            console.error('Error en Gemini API:', error);
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

Proporcioná tu análisis en formato estructurado y completo:

FORTALEZAS:
[Listá las fortalezas principales del trabajo en 3-5 puntos específicos]

ÁREAS DE MEJORA:
[Identificá 3-5 áreas específicas que necesitan trabajo, con ejemplos del texto]

SUGERENCIAS CONCRETAS:
[Proporcioná 3-5 sugerencias específicas y accionables]

CALIFICACIÓN SUGERIDA:
[Sugerí una nota del 1-10 con justificación clara basada en los criterios]

PRÓXIMOS PASOS:
[Indicá 2-3 acciones concretas que debería hacer ${nombreEstudiante || 'el estudiante'}]

IMPORTANTE: Escribí un análisis COMPLETO y DETALLADO. No abrevies ni cortes el feedback. Dirigite a ${nombreEstudiante || 'el estudiante'} por su nombre cuando sea apropiado, usando "vos" (tenés, mostrás, etc.). Mantené un tono formal académico pero cercano y cordial.`;

        const respuesta = await this.call(prompt, { maxTokens: 65536 });
        return this.limpiarMarkdown(respuesta);
    }

    // === ANÁLISIS DE PREGUNTA INDIVIDUAL ===
    async analizarPreguntaIndividual(preguntaTexto, respuestaEstudiante, materia, puntajeMax, nombreEstudiante = '') {
        const prompt = `Eres un profesor de ${materia} evaluando una pregunta de cuestionario.

PREGUNTA:
${preguntaTexto}

RESPUESTA DEL ESTUDIANTE:
${respuestaEstudiante}

Puntaje máximo: ${puntajeMax} puntos

Proporciona una evaluación completa, clara y concisa en el siguiente formato:

PUNTAJE SUGERIDO: [X]/${puntajeMax} puntos

JUSTIFICACIÓN:
[Explica por qué este puntaje. Menciona qué está bien y qué falta o podría mejorar. Sé específico.]

RETROALIMENTACIÓN PARA EL ESTUDIANTE:
${nombreEstudiante || 'Hola'},

[Proporciona un comentario completo y constructivo:
- Reconoce los aspectos positivos de la respuesta
- Señala las áreas que necesitan mejora con ejemplos específicos
- Sugiere cómo el estudiante puede profundizar o corregir
- Usa tono cordial y académico (vos: tenés, mostrás, etc.)
- Sé específico y educativo
- Guía sin dar la respuesta completa]

Asegúrate de ser claro, completo y conciso. La retroalimentación debe ser útil para el aprendizaje del estudiante.`;

        return await this.call(prompt, { maxTokens: 20000 });
    }

    // === ANÁLISIS DE CUESTIONARIO ===
    async analizarCuestionario(intentoData) {
        const prompt = `Eres un profesor que analiza el desempeño de un estudiante en un cuestionario.

INFORMACIÓN DEL CUESTIONARIO:
- Nombre: ${intentoData.quizName}
- Estudiante: ${intentoData.studentName}
- Intento: ${intentoData.attempt}
- Puntuación: ${intentoData.sumgrades}/${intentoData.maxgrades || 10}

PREGUNTAS Y RESPUESTAS:
${intentoData.questions || 'No disponible'}

Proporciona un análisis pedagógico que incluya:

1. EVALUACIÓN GENERAL: Un resumen del desempeño del estudiante

2. FORTALEZAS: Identifica las áreas donde el estudiante demostró buen conocimiento

3. ÁREAS DE MEJORA: Señala los conceptos que necesita reforzar

4. RECOMENDACIONES: Sugiere estrategias específicas de estudio

5. COMENTARIOS MOTIVACIONALES: Brinda palabras de aliento

IMPORTANTE: Dirígete al estudiante en segunda persona (tú/usted)`;

        return await this.call(prompt);
    }

    // === MODERACIÓN DE FOROS ===
    async moderarDiscusion(posts, contexto = '') {
        const prompt = `Eres un profesor moderando una discusión en un foro académico.

${contexto ? `CONTEXTO:\n${contexto}\n\n` : ''}

POSTS:
${posts}

Analiza la discusión y proporciona:

1. RESUMEN: Resumen de los puntos principales discutidos

2. CALIDAD DE LA PARTICIPACIÓN: Evalúa la calidad de las contribuciones

3. PUNTOS DESTACADOS: Identifica contribuciones valiosas

4. OPORTUNIDADES DE MEJORA: Sugiere cómo mejorar la discusión

5. PREGUNTA DE SEGUIMIENTO: Propone una pregunta para profundizar el debate`;

        return await this.call(prompt);
    }

    // === RESPUESTA AUTOMÁTICA EN FOROS ===
    async generarRespuestaForo(pregunta, contexto = '') {
        const prompt = `Eres un profesor asistiendo a un estudiante en un foro.

${contexto ? `CONTEXTO DEL CURSO:\n${contexto}\n\n` : ''}

PREGUNTA DEL ESTUDIANTE:
${pregunta}

Genera una respuesta que:
1. Sea educativa y guíe al estudiante, no que dé la respuesta directa
2. Haga preguntas que promuevan el pensamiento crítico
3. Sugiera recursos o lecturas adicionales
4. Sea alentadora y constructiva

IMPORTANTE: No des respuestas completas a ejercicios o tareas, guía el pensamiento.`;

        return await this.call(prompt);
    }

    // === GENERACIÓN DE CONTENIDO ===
    async generarContenidoPagina(tema, nivel = 'universitario', longitud = 'medio') {
        const prompt = `Genera contenido educativo sobre el siguiente tema:

TEMA: ${tema}
NIVEL: ${nivel}
LONGITUD: ${longitud} (corto: 300 palabras, medio: 600 palabras, largo: 1000+ palabras)

Estructura el contenido con:
1. Introducción clara y enganchadora
2. Desarrollo del tema con ejemplos
3. Conceptos clave destacados
4. Conclusión
5. Preguntas para reflexionar

Formato: HTML limpio (usa <h2>, <p>, <ul>, <strong>, etc.)`;

        return await this.call(prompt, { maxTokens: 4096 });
    }

    // === GENERACIÓN DE ETIQUETAS ===
    async generarEtiqueta(tipo, contenidoSolicitado) {
        const prompt = `Genera el texto para una etiqueta de Moodle tipo "${tipo}" sobre: "${contenidoSolicitado}"

REQUISITOS:
- 4-6 oraciones (más extenso que lo habitual)
- Texto motivador, cálido y profesional
- Apropiado para contexto educativo universitario
- Incluye detalles relevantes y específicos
- Tono acogedor pero académico
- SIN formato markdown, solo texto plano

IMPORTANTE: Genera un mensaje completo y atractivo que realmente conecte con los estudiantes.

Ejemplos según el tipo:

BIENVENIDA:
"¡Bienvenidos al segundo cuatrimestre! Es un placer recibirlos en este nuevo período académico lleno de desafíos y oportunidades de crecimiento. Este espacio virtual será nuestro punto de encuentro durante las próximas semanas, donde encontrarán todos los materiales, actividades y recursos necesarios para su aprendizaje. Les animamos a participar activamente, compartir sus ideas y aprovechar al máximo esta experiencia educativa. Recuerden que estamos aquí para acompañarlos en cada paso del camino. ¡Adelante con entusiasmo y dedicación!"

ANUNCIO:
"Estimados estudiantes, queremos informarles sobre un cambio importante en el calendario académico. El examen parcial que estaba programado para el 15 de marzo se ha reprogramado para el 22 de marzo a las 10:00 hs en el aula 305. Este cambio les permitirá tener una semana adicional de preparación. Recuerden revisar los temas que serán evaluados en la sección de contenidos del curso. Para cualquier consulta o duda, no duden en escribir en el foro de consultas o enviar un mensaje privado."

Ahora genera el texto para el tipo "${tipo}":`;

        return await this.call(prompt, { maxTokens: 800, temperature: 0.7 });
    }

    // === GENERACIÓN DE MENSAJES PARA FOROS ===
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

Dirígete al estudiante directamente.`;

        return await this.call(prompt);
    }
}

// Exportar instancia global
const geminiAPI = new GeminiAPI();
