/**
 * FRANKY TECH — Server Entry Point
 * -----------------------------------------------------------
 */

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('=================================================');
  console.log('  FRANKY TECH — Build. Manage. Grow.');
  console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Listening   : http://localhost:${PORT}`);
  console.log('=================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[FRANKY TECH] SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (reason) => {
  console.error('[FRANKY TECH] Unhandled promise rejection:', reason);
});
