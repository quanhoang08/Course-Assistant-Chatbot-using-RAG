import api from './api';

export const sendMessageToAI = async (courseId, message, sessionId = null, model) => {
    try {
        const payload = {
            course_id: courseId,
            message: message,
            model: model || 'gemini-2.5-flash'
        };

        if (sessionId) {
            payload.session_id = sessionId;
        }

        const response = await api.post('chat/echo/', payload);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn cho AI:", error);
        throw error;
    }
};

export const sendMessageToAIStream = async (courseId, message, sessionId = null, model, onChunk, onDone, onError) => {
    try {
        const payload = {
            course_id: courseId,
            message: message,
            model: model || 'gemini-2.5-flash'
        };
        if (sessionId) payload.session_id = sessionId;

        const token = localStorage.getItem('access_token');
        const apiBase = api.defaults.baseURL ? (api.defaults.baseURL.endsWith('/') ? api.defaults.baseURL : api.defaults.baseURL + '/') : 'http://localhost:8000/api/';
        
        const response = await fetch(`${apiBase}chat/stream/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let lineBuffer = '';
        let sawDone = false;
        let sawStreamError = false;

        while (true) {
            const { done, value } = await reader.read();
            lineBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });

            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() ?? '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (!dataStr) continue;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.type === 'meta') {
                             if (onChunk) onChunk(data); 
                        } else if (data.type === 'chunk' || data.type === 'tool') {
                             if (onChunk) onChunk(data);
                        } else if (data.type === 'done') {
                             sawDone = true;
                             if (onDone) onDone();
                        } else if (data.type === 'error') {
                             sawStreamError = true;
                             if (onError) onError(data.content);
                        }
                    } catch (e) {
                         console.error("Parse JSON stream error:", e, dataStr);
                    }
                }
            }

            if (done) break;
        }
        if (!sawDone && !sawStreamError && onDone) onDone();
    } catch (error) {
        console.error("Lỗi streaming:", error);
        if (onError) onError(error);
    }
};

export const getChatHistory = async (courseId, sessionId = null) => {
    try {
        let url = `chat/history/?course_id=${courseId}`;
        if (sessionId) {
            url += `&session_id=${sessionId}`;
        }
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử chat:", error);
        throw error;
    }
};

export const uploadCourseFile = async (courseId, file) => {
    try {
        const formData = new FormData();
        formData.append('course_id', courseId);
        formData.append('file', file);

        const response = await api.post('chat/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000,
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi upload file:", error);
        throw error;
    }
};

export const getCourseDocuments = async (courseId) => {
    try {
        const response = await api.get(`chat/upload/?course_id=${courseId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách tài liệu:", error);
        return [];
    }
};

export const getCourseSessions = async (courseId) => {
    try {
        // Bỏ dấu '/' ở đầu
        const response = await api.get(`chat/sessions/?course_id=${courseId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách phiên chat:", error);
        throw error;
    }
};

export const deleteCourseSession = async (sessionId) => {
    try {
        const response = await api.delete(`chat/sessions/${sessionId}/`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa phiên chat:", error);
        throw error;
    }
};

export const deleteAllChatHistory = async () => {
    try {
        const response = await api.delete('/chat/sessions/delete_all/');
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa toàn bộ lịch sử chat:', error);
        throw error;
    }
};