import app from './src/app.js';
import mongoose from 'mongoose';
import config from './configs/config.js';

mongoose.connect(config.MONGO_URL)
  .then(() => console.log('Connected to MongoDB!'));

app.listen(config.PORT, () => {
  console.log(`Server is running on http://localhost:${config.PORT}`)
})