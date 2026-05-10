import { AppError } from '../utils/AppError.js';

export function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate({ body: req.body, query: req.query, params: req.params }, { abortEarly: false });
    if (error) return next(new AppError('Validation failed', 400, error.details.map((item) => item.message)));
    req.validated = value;
    next();
  };
}

