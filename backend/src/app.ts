import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import healthRoute from './routes/health.route';
import analyzeRoutes from './routes/analyze.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoute);
app.use('/', analyzeRoutes); 

if (require.main === module) {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
