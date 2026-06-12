import * as brandService from './brand.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const getMyBrand = async (req, res) => {
  const brand = await brandService.getMyBrand(req.user.id);
  sendSuccess(res, brand);
};

export const updateMyBrand = async (req, res) => {
  const brand = await brandService.updateBrandProfile(req.user.id, req.body);
  sendSuccess(res, brand, 'Brand profile updated successfully.');
};

export const getBrandBySlug = async (req, res) => {
  const brand = await brandService.getBrandBySlug(req.params.slug);
  sendSuccess(res, brand);
};

export const listBrands = async (req, res) => {
  const result = await brandService.listBrands(req.query);
  sendSuccess(res, result);
};

export const getDashboardStats = async (req, res) => {
  const stats = await brandService.getBrandDashboardStats(req.user.id);
  sendSuccess(res, stats);
};
