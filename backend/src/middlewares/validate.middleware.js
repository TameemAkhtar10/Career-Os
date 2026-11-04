import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure it throws a 422 ApiError with field-level error details.
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(new ApiError(422, "Validation failed", errors));
  }

  req.body = result.data; // replace with parsed + coerced data
  next();
};

export default validate;
