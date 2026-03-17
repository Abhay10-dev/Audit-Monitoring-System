require('dotenv').config();
const app = require('./app');
const { initJobs } = require('./jobs');

const PORT = process.env.PORT || 5000;

initJobs();

app.listen(PORT, () => {
  console.log(`🚀 AMS Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
