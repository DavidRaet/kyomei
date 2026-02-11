import sourceMapSupport from 'source-map-support';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';

sourceMapSupport.install();

const app = express();

app.use(cors());
app.use(morgan("tiny"));

app.use(express.json());

app.use('/api/auth', authRouter);

app.use(errorHandler);




export default app; 

