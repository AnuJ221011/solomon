import * as shareLinkService from './shareLink.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const createShareLink = async (req, res) => {
  const link = await shareLinkService.createShareLink(req.user.id, req.body);
  sendSuccess(res, link, 'Share link created', 201);
};

export const getShareLink = async (req, res) => {
  // Password can be passed as a query param: GET /:token?password=secret
  const link = await shareLinkService.getShareLinkByToken(req.params.token, req.query.password);
  sendSuccess(res, link);
};

export const recordVisit = async (req, res) => {
  await shareLinkService.recordVisit(req.body.token, req.body.isUnique);
  sendSuccess(res, null);
};

export const getMyShareLinks = async (req, res) => {
  const links = await shareLinkService.getMyShareLinks(req.user.id);
  sendSuccess(res, links);
};

export const updateShareLink = async (req, res) => {
  const link = await shareLinkService.updateShareLink(req.user.id, req.params.id, req.body);
  sendSuccess(res, link, 'Share link updated');
};

export const deleteShareLink = async (req, res) => {
  await shareLinkService.deleteShareLink(req.user.id, req.params.id);
  sendSuccess(res, null, 'Share link deleted');
};
