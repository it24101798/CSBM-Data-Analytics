module.exports = {
  apps: [
    {
      name: "csbm-analytics-api",
      cwd: "./backend",
      script: "server.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
      },
    },
  ],
};
