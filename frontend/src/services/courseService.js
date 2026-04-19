import api from './api'; 

export const getCourseMaterials = async (courseId) => {
    try {
        const response = await api.get(`courses/${courseId}/documents/`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy tài liệu môn học:", error);
        return [];
    }
};
