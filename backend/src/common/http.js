class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function ok(res, data, meta = null) {
  return res.status(200).json({ success: true, data, error: null, meta });
}

function created(res, data) {
  return res.status(201).json({ success: true, data, error: null, meta: null });
}

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, data: null, error: { code, message }, meta: null });
}

module.exports = { ApiError, ok, created, fail };
