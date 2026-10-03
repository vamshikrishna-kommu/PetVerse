import type { Request, Response } from 'express';
import { petService } from './pet.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';
import { uploadPetAvatar, uploadPetGalleryImage } from '../../shared/utils/cloudinaryUploader';
import { AppError } from '../../shared/errors/AppError';

export const petController = {
  getPets: asyncHandler(async (req: Request, res: Response) => {
    const { search, species, breed, sortBy, sortOrder, page, limit } = req.query;
    const result = await petService.getOwnerPets(req.user!.userId, {
      search: search as string,
      species: species as string,
      breed: breed as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    apiResponse.success(res, result);
  }),

  getLostPets: asyncHandler(async (req: Request, res: Response) => {
    const { species, search, page, limit } = req.query;
    const result = await petService.getLostPets({
      species: species as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    apiResponse.success(res, result);
  }),

  getPetById: asyncHandler(async (req: Request, res: Response) => {
    const pet = await petService.getPetById(
      req.params.id as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, pet);
  }),

  getPublicPet: asyncHandler(async (req: Request, res: Response) => {
    const pet = await petService.getPetByQrCode(req.params.qrCode as string);
    apiResponse.success(res, pet);
  }),

  createPet: asyncHandler(async (req: Request, res: Response) => {
    const pet = await petService.createPet(req.user!.userId, req.body);
    apiResponse.created(res, pet);
  }),

  updatePet: asyncHandler(async (req: Request, res: Response) => {
    const pet = await petService.updatePet(
      req.params.id as string,
      req.user!.userId,
      req.body,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, pet);
  }),

  deletePet: asyncHandler(async (req: Request, res: Response) => {
    await petService.deletePet(
      req.params.id as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.noContent(res);
  }),

  getPetTimeline: asyncHandler(async (req: Request, res: Response) => {
    const timeline = await petService.getPetTimeline(
      req.params.id as string,
      req.user!.userId
    );
    apiResponse.success(res, timeline);
  }),

  /** POST /pets/:id/avatar — upload a pet avatar image (multipart/form-data) */
  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No image file provided', 400, 'MISSING_FILE');
    }

    const avatarUrl = await uploadPetAvatar(req.file.buffer, req.params.id as string);
    const pet = await petService.updateAvatar(
      req.params.id as string,
      req.user!.userId,
      avatarUrl
    );
    apiResponse.success(res, pet);
  }),

  /** POST /pets/:id/gallery — upload multiple images to pet gallery */
  uploadGallery: asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('No images provided', 400, 'MISSING_FILES');
    }

    const uploadedUrls = await Promise.all(
      files.map((file) => uploadPetGalleryImage(file.buffer, req.params.id as string))
    );

    const pet = await petService.addGalleryImages(
      req.params.id as string,
      req.user!.userId,
      uploadedUrls
    );
    apiResponse.success(res, pet);
  }),

  /** DELETE /pets/:id/gallery — remove image from pet gallery */
  removeGalleryImage: asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      throw new AppError('Image URL is required', 400, 'MISSING_IMAGE_URL');
    }

    const pet = await petService.removeGalleryImage(
      req.params.id as string,
      req.user!.userId,
      imageUrl
    );
    apiResponse.success(res, pet);
  }),

  /** PATCH /pets/:id/gallery/primary — set gallery image as primary avatar */
  setPrimaryGalleryImage: asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      throw new AppError('Image URL is required', 400, 'MISSING_IMAGE_URL');
    }

    const pet = await petService.setPrimaryGalleryImage(
      req.params.id as string,
      req.user!.userId,
      imageUrl
    );
    apiResponse.success(res, pet);
  }),
};
