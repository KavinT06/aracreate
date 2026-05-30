const parseConfiguredOrigins = () => {
  const rawOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URLS]
    .flatMap((value) => (value ? value.split(',') : []))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    configuredOrigins: rawOrigins,
    allowAnyOrigin: rawOrigins.length === 0,
  };
};

const createCorsOriginChecker = () => {
  const { configuredOrigins, allowAnyOrigin } = parseConfiguredOrigins();
  const devOrigins = new Set(['http://localhost:5173', 'http://localhost:5174']);
  const allowedOrigins = new Set([...configuredOrigins, ...devOrigins]);

  return (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowAnyOrigin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  };
};

module.exports = { createCorsOriginChecker, parseConfiguredOrigins };