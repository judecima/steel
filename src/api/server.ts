import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import proyectosRoutes from './routes/proyectos.routes';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api', proyectosRoutes);

app.listen(PORT, () => {
    console.log(`--- STEEL FRAME API SERVER ---`);
    console.log(`Puerto: ${PORT}`);
    console.log(`Estado: Running`);
    console.log(`Endpoint: http://localhost:${PORT}/api/health`);
    console.log('-------------------------------');
});
