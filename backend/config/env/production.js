module.exports = {
  datastores: {
    default: {
      url: '__MYSQL_URL__',
    },
  },
  models: {
    migrate: 'safe',
  },
  blueprints: {
    shortcuts: false,
  },
  security: {
    cors: {
      allowOrigins: [
        'https://coin-base-trader.com',
      ]
    },
  },
  sockets: {
    onlyAllowOrigins: [
      'https://coin-base-trader.com',
    ],
  },
  log: {
    level: 'debug'
  },
  http: {
    cache: 60 * 1000, // One year
    trustProxy: true,
  },
  cors: {
    allRoutes: true,
    allowCredentials: true,
    allowRequestHeaders: 'content-type, authorization'
  },
  // port: 80,
  // ssl: undefined,
  hooks: {
    views: false
  },

  mail: {
    apiKey: '__MAILGUN_API_KEY__',
    domain: '__MAILGUN_API_DOMAIN__',
  }
};
