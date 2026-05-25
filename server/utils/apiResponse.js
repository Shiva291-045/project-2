export const success = (res, data = {}, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

export const error = (res, message = "An error occurred", status = 500, details = null) =>
  res.status(status).json({ success: false, message, ...(details && { details }) });
