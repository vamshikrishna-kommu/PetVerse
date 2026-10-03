import { axiosInstance } from '@/shared/lib/axios';

export interface ILostFoundReport {
  _id: string;
  type: 'lost' | 'found';
  petId?: string;
  petName?: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  reporterId: string;
  reporterName: string;
  contactMethod: 'in_app' | 'phone' | 'email';
  contactPhone?: string;
  contactEmail?: string;
  location: {
    coordinates: [number, number];
    address: string;
    city?: string;
  };
  eventDate: string;
  description: string;
  photos: string[];
  status: 'active' | 'resolved' | 'archived';
  moderationStatus: 'approved' | 'pending' | 'flagged' | 'rejected';
  inquiries?: Array<{
    _id?: string;
    senderId: string;
    senderName: string;
    message: string;
    contactInfo?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const lostFoundApi = {
  getReports: async (params?: {
    type?: 'lost' | 'found';
    species?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ILostFoundReport[]; total: number; page: number; limit: number }> => {
    const { data } = await axiosInstance.get('/lost-found', { params });
    return data.data;
  },

  getReportById: async (id: string): Promise<ILostFoundReport> => {
    const { data } = await axiosInstance.get(`/lost-found/${id}`);
    return data.data;
  },

  createReport: async (reportData: {
    type: 'lost' | 'found';
    petId?: string;
    petName?: string;
    species: string;
    breed?: string;
    color?: string;
    gender?: string;
    contactMethod?: string;
    contactPhone?: string;
    contactEmail?: string;
    location: {
      coordinates: [number, number];
      address: string;
      city?: string;
    };
    eventDate: string;
    description: string;
    photos?: string[];
  }): Promise<ILostFoundReport> => {
    const { data } = await axiosInstance.post('/lost-found', reportData);
    return data.data;
  },

  findMatches: async (
    id: string
  ): Promise<Array<{ report: ILostFoundReport; score: number }>> => {
    const { data } = await axiosInstance.get(`/lost-found/${id}/matches`);
    return data.data;
  },

  sendInquiry: async (
    id: string,
    inquiry: { message: string; contactInfo?: string }
  ): Promise<{ message: string }> => {
    const { data } = await axiosInstance.post(`/lost-found/${id}/inquiry`, inquiry);
    return data.data;
  },

  resolveReport: async (id: string): Promise<ILostFoundReport> => {
    const { data } = await axiosInstance.patch(`/lost-found/${id}/resolve`);
    return data.data;
  },
};
