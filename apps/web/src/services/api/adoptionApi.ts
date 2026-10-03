import api from '../../shared/lib/axios';
import type { IAdoptionListing, IAdoptionApplication } from '@petverse/shared-types';

export const adoptionApi = {
  getListings: (params?: { species?: string; gender?: string; size?: string; status?: string; search?: string; page?: number; limit?: number }) =>
    api.get<{ data: { listings: IAdoptionListing[]; total: number; page: number; totalPages: number } }>('/adoption/listings', { params }).then((res) => res.data.data),

  getListing: (id: string) =>
    api.get<{ data: IAdoptionListing }>(`/adoption/listings/${id}`).then((res) => res.data.data),

  createListing: (data: Partial<IAdoptionListing>) =>
    api.post<{ data: IAdoptionListing }>('/adoption/listings', data).then((res) => res.data.data),

  updateListing: (id: string, data: Partial<IAdoptionListing>) =>
    api.put<{ data: IAdoptionListing }>(`/adoption/listings/${id}`, data).then((res) => res.data.data),

  deleteListing: (id: string) =>
    api.delete(`/adoption/listings/${id}`).then((res) => res.data),

  submitApplication: (listingId: string, data: any) =>
    api.post<{ data: IAdoptionApplication }>(`/adoption/listings/${listingId}/apply`, data).then((res) => res.data.data),

  getMyApplications: () =>
    api.get<{ data: Array<IAdoptionApplication & { listing?: IAdoptionListing }> }>('/adoption/applications/my').then((res) => res.data.data),

  getListingApplications: (listingId: string) =>
    api.get<{ data: IAdoptionApplication[] }>(`/adoption/listings/${listingId}/applications`).then((res) => res.data.data),

  updateApplicationStatus: (id: string, status: string, reviewNotes?: string) =>
    api.patch<{ data: IAdoptionApplication }>(`/adoption/applications/${id}/status`, { status, reviewNotes }).then((res) => res.data.data),
};
