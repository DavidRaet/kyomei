import sourceMapSupport from 'source-map-support';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
sourceMapSupport.install();
const app = express();
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());
export default app;
//# sourceMappingURL=server.js.map