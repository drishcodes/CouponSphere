import { nanoid } from 'nanoid';

export function requestContext(req, res, next) {
  req.requestId = req.headers['x-request-id'] || nanoid();
  res.setHeader('x-request-id', req.requestId);
  next();
}

