import * as orderService from './order.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const checkout = async (req, res) => {
  const orders = await orderService.createOrdersFromCart(req.user.id, req.body);
  sendSuccess(res, orders, 'Orders placed successfully.', 201);
};

export const createManualOrder = async (req, res) => {
  const order = await orderService.createManualOrder(req.user.id, req.body);
  sendSuccess(res, order, 'Manual order created successfully.', 201);
};

export const listMyBrandOrders = async (req, res) => {
  const result = await orderService.listBrandOrders(req.user.id, req.query);
  sendSuccess(res, result);
};

export const listMyBuyerOrders = async (req, res) => {
  const result = await orderService.listBuyerOrders(req.user.id, req.query);
  sendSuccess(res, result);
};

export const getOrder = async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.id, req.user.role);
  sendSuccess(res, order);
};

export const updateStatus = async (req, res) => {
  const order = await orderService.updateOrderStatus(req.user.id, req.params.id, req.body);
  sendSuccess(res, order, 'Order status updated successfully.');
};
