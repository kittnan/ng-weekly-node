module.exports = {
  apps: [
    {
      name: "ng-weekly",
      script: "./index.js", // your script
      watch: true,
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 4047,
        DATABASE: "mongodb://10.200.90.152:27017/ng-weekly",
      },
    },
  ],
};
