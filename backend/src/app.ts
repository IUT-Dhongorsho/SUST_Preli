import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import healthRoute from './routes/health.route';
import { trackMetrics, metricsRoute } from './middlewares/metrics.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Apply prometheus tracking globally
app.use(trackMetrics);

// Routes
app.get('/metrics', metricsRoute);
app.use('/health', healthRoute);

if (require.main === module) {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
