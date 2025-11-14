// MOODLE API - Funciones centralizadas
class MoodleAPI {
    constructor() {
        this.config = this.loadConfig();
        this.userId = null;
        this.userInfo = null;
    }

    // Cargar configuración desde localStorage
    loadConfig() {
        const saved = localStorage.getItem('moodleConfig');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            url: '',
            token: '',
            geminiKey: ''
        };
    }

    // Guardar configuración
    saveConfig(url, token, geminiKey) {
        this.config = { url, token, geminiKey };
        localStorage.setItem('moodleConfig', JSON.stringify(this.config));
    }

    // Verificar si está configurado
    isConfigured() {
        return this.config.url && this.config.token && this.config.geminiKey;
    }

    // Llamada genérica a la API de Moodle
    async call(wsfunction, params = {}) {
        const url = new URL(`${this.config.url}/webservice/rest/server.php`);
        url.searchParams.append('wstoken', this.config.token);
        url.searchParams.append('wsfunction', wsfunction);
        url.searchParams.append('moodlewsrestformat', 'json');

        // Agregar parámetros
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        Object.keys(item).forEach(subKey => {
                            url.searchParams.append(`${key}[${index}][${subKey}]`, item[subKey]);
                        });
                    } else {
                        url.searchParams.append(`${key}[${index}]`, item);
                    }
                });
            } else {
                url.searchParams.append(key, value);
            }
        });

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();

            if (data && data.exception) {
                throw new Error(data.message || 'Error en la API de Moodle');
            }
            
            return data;
        } catch (error) {
            console.error('Error en llamada a Moodle:', error);
            throw error;
        }
    }

    // === INFORMACIÓN DEL USUARIO ===
    async getSiteInfo() {
        return await this.call('core_webservice_get_site_info');
    }

    async getUserProfile() {
        const siteInfo = await this.getSiteInfo();
        const userProfile = {
            id: siteInfo.userid,
            fullname: siteInfo.fullname,
            email: siteInfo.useremail,
            username: siteInfo.username
        };
        this.userId = userProfile.id;
        this.userInfo = userProfile;
        return userProfile;
    }

    // Alias para getUserProfile
    async getCurrentUser() {
        return await this.getUserProfile();
    }

    // === CURSOS ===
    async getCourses(userid = null) {
        if (!userid) {
            const siteInfo = await this.getSiteInfo();
            userid = siteInfo.userid;
        }
        
        const courses = await this.call('core_enrol_get_users_courses', { userid });
        return courses.filter(c => c.visible === 1);
    }

    async getCourseContents(courseid) {
        return await this.call('core_course_get_contents', { courseid });
    }

    // === TAREAS (ASSIGNMENTS) ===
    async getAssignments(courseids) {
        return await this.call('mod_assign_get_assignments', { courseids });
    }

    async getSubmissions(assignmentids) {
        return await this.call('mod_assign_get_submissions', { assignmentids });
    }

    async getGrades(assignmentids) {
        return await this.call('mod_assign_get_grades', { assignmentids });
    }

    async saveGrade(assignmentid, userid, grade, attemptnumber = 0, feedback = '') {
        // Moodle requiere que attemptnumber sea >= 0
        const validAttempt = attemptnumber >= 0 ? attemptnumber : 0;
        
        // Usar POST para enviar los datos de forma correcta
        const formData = new URLSearchParams();
        formData.append('wstoken', this.config.token);
        formData.append('wsfunction', 'mod_assign_save_grade');
        formData.append('moodlewsrestformat', 'json');
        formData.append('assignmentid', assignmentid);
        formData.append('userid', userid);
        formData.append('grade', grade);
        formData.append('attemptnumber', validAttempt);
        formData.append('addattempt', '1');
        formData.append('workflowstate', '');
        formData.append('applytoall', '1');
        formData.append('plugindata[assignfeedbackcomments_editor][text]', feedback);
        formData.append('plugindata[assignfeedbackcomments_editor][format]', '1');

        try {
            const response = await fetch(`${this.config.url}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();

            if (data && data.exception) {
                throw new Error(data.message || 'Error en la API de Moodle');
            }
            
            return data;
        } catch (error) {
            console.error('Error guardando calificación:', error);
            throw error;
        }
    }

    // === CUESTIONARIOS (QUIZZES) ===
    async getQuizzes(courseids) {
        return await this.call('mod_quiz_get_quizzes_by_courses', { courseids });
    }

    async getQuizAttempts(quizid, status = 'all') {
        return await this.call('mod_quiz_get_user_attempts', { quizid, status });
    }

    async getAttemptData(attemptid) {
        // Para intentos en progreso
        return await this.call('mod_quiz_get_attempt_data', { attemptid });
    }

    async getAttemptReview(attemptid) {
        // Para intentos finalizados - esta es la función correcta
        return await this.call('mod_quiz_get_attempt_review', { attemptid });
    }

    async getQuizAttemptReview(attemptid) {
        return await this.call('mod_quiz_get_attempt_review', { attemptid });
    }

    // === CALIFICACIÓN DE QUIZZES (MÉTODO CORRECTO PARA PROFESORES) ===
    
    /**
     * Calificar pregunta de quiz usando la API correcta de Moodle
     * Esta función usa un enfoque directo con la base de datos de Moodle
     */
    async gradeQuizQuestion(attemptid, slot, grade, comment = '') {
        try {
            // MÉTODO 1: Usar mod_quiz_submit_grading_form (introducido en Moodle 3.1)
            // Esta es la función correcta para que profesores califiquen intentos de estudiantes
            
            const formData = new URLSearchParams();
            formData.append('wstoken', this.config.token);
            formData.append('wsfunction', 'mod_quiz_submit_grading_form');
            formData.append('moodlewsrestformat', 'json');
            formData.append('attemptid', attemptid);
            
            // Formato de datos para calificar pregunta tipo essay
            formData.append(`data[0][name]`, `q${slot}:_mark`);
            formData.append(`data[0][value]`, grade);
            
            if (comment) {
                formData.append(`data[1][name]`, `q${slot}:_comment`);
                formData.append(`data[1][value]`, comment);
                formData.append(`data[2][name]`, `q${slot}:_commentformat`);
                formData.append(`data[2][value]`, '1'); // 1 = HTML format
            }

            const response = await fetch(`${this.config.url}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();

            if (data && data.exception) {
                console.warn('mod_quiz_submit_grading_form falló, intentando método alternativo...');
                return await this.gradeQuizQuestionAlternative(attemptid, slot, grade, comment);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Error en gradeQuizQuestion:', error);
            // Intentar método alternativo
            return await this.gradeQuizQuestionAlternative(attemptid, slot, grade, comment);
        }
    }

    /**
     * Método alternativo: Usar directamente core_question_update_flag
     * y luego actualizar manualmente la calificación
     */
    async gradeQuizQuestionAlternative(attemptid, slot, grade, comment = '') {
        try {
            // Obtener información del attempt
            const attemptData = await this.getAttemptReview(attemptid);
            const question = attemptData.questions.find(q => q.slot === slot);
            
            if (!question) {
                throw new Error(`No se encontró la pregunta en el slot ${slot}`);
            }

            // Usar la función de grading para módulo de quiz
            // Esta es una función menos documentada pero que funciona para profesores
            const formData = new URLSearchParams();
            formData.append('wstoken', this.config.token);
            formData.append('wsfunction', 'core_question_update_flag');
            formData.append('moodlewsrestformat', 'json');
            formData.append('qubaid', attemptData.attempt.uniqueid);
            formData.append('questionid', question.number);
            formData.append('qaid', question.id);
            formData.append('slot', slot);
            formData.append('checksum', question.flagged ? '1' : '0');
            formData.append('newstate', 1);

            // Intentar actualizar
            const response = await fetch(`${this.config.url}/webservice/rest/server.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (data && data.exception) {
                throw new Error(data.message || 'Error actualizando pregunta');
            }

            // Ahora intentar guardar la calificación usando un POST directo
            // al endpoint de Moodle (esto requiere permisos de profesor)
            return await this.directGradeUpdate(attemptid, slot, grade, comment, question);

        } catch (error) {
            console.error('Error en método alternativo:', error);
            throw new Error(
                `No se pudo calificar la pregunta. ` +
                `Esto puede deberse a:\n` +
                `1. Tu usuario no tiene permisos de profesor/calificador en este curso\n` +
                `2. El intento ya fue calificado o está cerrado\n` +
                `3. La versión de Moodle no soporta esta función vía API\n\n` +
                `Error técnico: ${error.message}`
            );
        }
    }

    /**
     * Actualización directa de calificación (requiere permisos de profesor)
     */
    async directGradeUpdate(attemptid, slot, grade, comment, questionData) {
        try {
            // Este método usa el endpoint de comentarios/calificaciones de Moodle
            // Equivalente a lo que hace la interfaz web cuando un profesor califica
            
            const formData = new URLSearchParams();
            formData.append('wstoken', this.config.token);
            formData.append('moodlewsrestformat', 'json');
            
            // Construir los datos de la calificación
            const gradeData = {
                attemptid: attemptid,
                slot: slot,
                grade: grade,
                maxgrade: questionData.maxmark || 1,
                comment: comment,
                commentformat: 1
            };

            // Agregar datos al form
            Object.keys(gradeData).forEach(key => {
                formData.append(key, gradeData[key]);
            });

            // Usar el endpoint interno de Moodle para actualizar calificaciones
            // Este endpoint existe pero no está documentado en la API pública
            const response = await fetch(`${this.config.url}/question/behaviour/manualgraded/ajax.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return { success: true, data };

        } catch (error) {
            console.error('Error en actualización directa:', error);
            throw error;
        }
    }

    /**
     * Guardar múltiples calificaciones de un intento
     */
    async gradeMultipleQuizQuestions(attemptid, grades) {
        // grades es un array de { slot, grade, comment }
        const results = [];
        
        for (const gradeData of grades) {
            try {
                const result = await this.gradeQuizQuestion(
                    attemptid,
                    gradeData.slot,
                    gradeData.grade,
                    gradeData.comment
                );
                results.push({ 
                    slot: gradeData.slot, 
                    success: true, 
                    result 
                });
            } catch (error) {
                results.push({ 
                    slot: gradeData.slot, 
                    success: false, 
                    error: error.message 
                });
            }
        }
        
        return { batch: true, results };
    }

    // === PARTICIPANTES DEL CURSO ===
    async getCourseParticipants(courseid) {
        return await this.call('core_enrol_get_enrolled_users', { courseid });
    }

    // === RESTO DE FUNCIONES (sin cambios) ===

    async getForumsByCourses(courseids) {
        return await this.call('mod_forum_get_forums_by_courses', { courseids });
    }

    async getForumDiscussions(forumid) {
        return await this.call('mod_forum_get_forum_discussions', { forumid });
    }

    async getDiscussionPosts(discussionid) {
        return await this.call('mod_forum_get_discussion_posts', { discussionid });
    }

    async addDiscussion(forumid, subject, message, groupid = -1) {
        return await this.call('mod_forum_add_discussion', {
            forumid,
            subject,
            message,
            groupid,
            options: [{
                name: 'discussionpinned',
                value: false
            }]
        });
    }

    async addDiscussionPost(postid, subject, message) {
        return await this.call('mod_forum_add_discussion_post', {
            postid,
            subject,
            message
        });
    }

    async getPages(courseids) {
        return await this.call('mod_page_get_pages_by_courses', { courseids });
    }

    async getResources(courseids) {
        return await this.call('mod_resource_get_resources_by_courses', { courseids });
    }

    async getUrls(courseids) {
        return await this.call('mod_url_get_urls_by_courses', { courseids });
    }

    async getFolders(courseids) {
        return await this.call('mod_folder_get_folders_by_courses', { courseids });
    }

    async getLabels(courseids) {
        return await this.call('mod_label_get_labels_by_courses', { courseids });
    }

    async getUsersByField(field, values) {
        const params = { field };
        values.forEach((value, index) => {
            params[`values[${index}]`] = value;
        });
        return await this.call('core_user_get_users_by_field', params);
    }

    async getConversations(userid, limitfrom = 0, limitnum = 50) {
        return await this.call('core_message_get_conversations', {
            userid,
            limitfrom,
            limitnum
        });
    }

    async getConversationMessages(userid, conversationid, limitfrom = 0, limitnum = 50) {
        return await this.call('core_message_get_conversation_messages', {
            currentuserid: userid,
            convid: conversationid,
            limitfrom,
            limitnum
        });
    }

    async sendMessageToConversation(conversationid, text) {
        const messages = [{
            text,
            textformat: 1
        }];
        return await this.call('core_message_send_messages_to_conversation', {
            conversationid,
            messages
        });
    }

    async getUnreadConversationsCount() {
        try {
            const result = await this.call('core_message_get_unread_conversations_count', {});
            return typeof result === 'number' ? result : 0;
        } catch (error) {
            console.error('Error obteniendo contador de mensajes no leídos:', error);
            return 0;
        }
    }

    async searchUsers(query, limitfrom = 0, limitnum = 20) {
        if (!this.userId) {
            await this.getCurrentUser();
        }
        
        return await this.call('core_message_message_search_users', {
            userid: this.userId,
            search: query,
            limitfrom,
            limitnum
        });
    }

    async createConversation(userid) {
        if (!this.userId) {
            await this.getCurrentUser();
        }
        
        const conversations = await this.getConversations(this.userId);
        
        const existing = conversations.conversations?.find(conv => 
            conv.members.some(member => member.id === userid)
        );
        
        if (existing) {
            return existing;
        }
        
        const messages = [{
            touserid: userid,
            text: 'Hola',
            textformat: 1
        }];
        
        const result = await this.call('core_message_send_instant_messages', {
            messages
        });
        
        const newConversations = await this.getConversations(this.userId);
        return newConversations.conversations?.[0];
    }

    async getGradeItems(courseid) {
        return await this.call('core_grades_get_grade_items', { courseid });
    }

    async getCourseGrades(courseid, userid = null) {
        return await this.call('gradereport_user_get_grade_items', { 
            courseid,
            userid: userid || this.userId
        });
    }

    async getGradesTable(courseid, userid = null) {
        return await this.call('gradereport_user_get_grades_table', {
            courseid,
            userid: userid || this.userId
        });
    }

    async getCourseGradesOverview() {
        return await this.call('gradereport_overview_get_course_grades', {
            userid: this.userId
        });
    }

    async updateGrades(courseid, grades) {
        return await this.call('core_grades_update_grades', {
            source: 'manual',
            courseid,
            grades
        });
    }

    async sendMessage(touserid, message) {
        return await this.call('core_message_send_instant_messages', {
            messages: [{
                touserid,
                text: message,
                textformat: 1
            }]
        });
    }

    async getCalendarEvents(courseids = []) {
        const events = await this.call('core_calendar_get_calendar_events', {
            options: {
                userevents: 1,
                siteevents: 1
            },
            events: {
                courseids
            }
        });
        return events.events || [];
    }

    async getBlocks(courseid) {
        return await this.call('core_block_get_course_blocks', { courseid });
    }

    async searchCourses(query) {
        return await this.call('core_course_search_courses', {
            criterianame: 'search',
            criteriavalue: query
        });
    }
}

// Exportar instancia global
const moodleAPI = new MoodleAPI();
