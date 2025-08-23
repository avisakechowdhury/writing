import api from './api';
import { Report } from '../types';

export const reportsApi = {
  // Submit a report
  submitReport: async (data: {
    reportedItemType: 'post' | 'comment' | 'chat_message' | 'user';
    reportedItemId: string;
    reason: 'spam' | 'inappropriate_content' | 'harassment' | 'hate_speech' | 'violence' | 'misinformation' | 'copyright_violation' | 'other';
    description: string;
  }): Promise<{ message: string; reportId: string }> => {
    const response = await api.post('/reports/submit', data);
    return response.data;
  },

  // Get user's reports
  getMyReports: async (page: number = 1, limit: number = 10): Promise<{
    reports: Report[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await api.get(`/reports/my-reports?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get report details
  getReport: async (reportId: string): Promise<Report> => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  // Update report
  updateReport: async (reportId: string, description: string): Promise<{
    message: string;
    report: Report;
  }> => {
    const response = await api.put(`/reports/${reportId}`, { description });
    return response.data;
  },

  // Delete report
  deleteReport: async (reportId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  }
};

export default reportsApi;
