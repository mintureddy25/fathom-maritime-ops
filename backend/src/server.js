const app = require('./app');
const sequelize = require('./config/db');

const PORT = Number(process.env.PORT) || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[db] connected');
    app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('[fatal] could not start:', err.message);
    process.exit(1);
  }
})();
