import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import authRoutes from './src/users/userRoute.js'
import productRoutes from './src/products/productsRoute.js'
import reviewRoutes from './src/reviews/reviewRouter.js'
import orderRoutes from './src/orders/orderRoute.js'
import statsRoutes from './src/stats/statsRoute.js'
import uploadImage from './src/utils/uploadImage.js'      

dotenv.config();
const  app = express();
const port = process.env.PORT || 5000;

app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb'}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}))
// all routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

main().then(()=> console.log('mongodb is connected')).catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.database_Url);
    app.get('/', (req, res) => {
        res.send('fibaba-ecommerce is running');
})
}

app.post('/uploadImage', (req, res) => {
    uploadImage(req.body.image)
      .then((url) => res.send(url))
      .catch((err) => res.status(500).send(err));
  });

app.listen(port,() =>{
    console.log(`listen on port ${port}`)
})