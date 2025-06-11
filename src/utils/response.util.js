export const successResponse = (res, data, meta = null, statusCode = 200) => {
  const response = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (res, statusCode = 500, message = "Internal Server Error", details = null) => {
  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};
