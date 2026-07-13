import * as shareLinkService from './shareLink.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const createShareLink = async (req, res) => {
  const link = await shareLinkService.createShareLink(req.user.id, req.body);
  sendSuccess(res, link, 'Share link created and ready.', 201);
};

export const getShareLink = async (req, res) => {
  // Password can be passed as a query param: GET /view/:identifier?password=secret
  const link = await shareLinkService.getShareLinkForView(req.params.identifier, req.query.password);
  sendSuccess(res, link);
};

export const recordVisit = async (req, res) => {
  await shareLinkService.recordVisit(req.body.identifier, req.body.isUnique);
  sendSuccess(res, null);
};

export const getMyShareLinks = async (req, res) => {
  const links = await shareLinkService.getMyShareLinks(req.user.id);
  sendSuccess(res, links);
};

export const updateShareLink = async (req, res) => {
  const link = await shareLinkService.updateShareLink(req.user.id, req.params.id, req.body);
  sendSuccess(res, link, 'Share link updated successfully.');
};

export const deleteShareLink = async (req, res) => {
  await shareLinkService.deleteShareLink(req.user.id, req.params.id);
  sendSuccess(res, null, 'Share link removed successfully.');
};
