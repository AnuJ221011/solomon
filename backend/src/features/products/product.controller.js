import * as productService from './product.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const listProducts = async (req, res) => {
  // Pass authenticated buyer's ID for personalised ranking (optional — public route)
  const result = await productService.listProducts({
    ...req.query,
    buyerUserId: req.user?.id,
  });
  sendSuccess(res, result);
};

export const getProduct = async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  sendSuccess(res, product);
};

export const listMyProducts = async (req, res) => {
  const result = await productService.listMyProducts(req.user.id, req.query);
  sendSuccess(res, result);
};

export const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.user.id, req.body);
  sendSuccess(res, product, `"${product.name}" listed successfully. Add photos to make it visible to buyers.`, 201);
};

export const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(req.user.id, req.params.id, req.body);
  sendSuccess(res, product, `"${product.name}" updated successfully.`);
};

export const deleteProduct = async (req, res) => {
  await productService.deleteProduct(req.user.id, req.params.id);
  sendSuccess(res, null, 'Product removed from your listings.');
};
