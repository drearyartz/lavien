require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`LA'VIEN backend ${PORT} portunda çalışıyor.`);
});
