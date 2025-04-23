// backend/src/index.ts
import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'; 
import cors from 'cors'; // <--- Импортируем CORS

const app = express();
const prisma = new PrismaClient();
// Render ИСПОЛЬЗУЕТ ПЕРЕМЕННУЮ ОКРУЖЕНИЯ PORT, или 10000 по умолчанию
// Не устанавливайте здесь жестко 3001 для продакшена
const PORT = process.env.PORT || 10000; 

app.use(express.json());

// --- НАСТРОЙКА CORS ---
// Разрешаем запросы с URL фронтенда (из переменной окружения или дефолтного)
// ЗАМЕНИТЕ URL по умолчанию на ваш URL с Netlify!
const frontendUrl = process.env.FRONTEND_URL || 'https://helpful-belekoy-339fe6.netlify.app'; 
console.log(`Allowing CORS for origin: ${frontendUrl}`); // Логируем для проверки
app.use(cors({
    origin: frontendUrl 
}));
// --------------------


// --- Маршрут Health Check ---
app.get('/api/health', async (req: Request, res: Response) => {
    console.log('GET /api/health');
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'UP', timestamp: new Date().toISOString(), db_status: 'connected' });
    } catch (error) {
        console.error("DB connection check failed:", error);
        res.status(503).json({ status: 'DOWN', timestamp: new Date().toISOString(), db_status: 'disconnected', error: 'Failed to connect to the database' });
    }
});


// --- Маршруты для Wishlist ---

// Получить вишлисты
app.get('/api/wishlists', async (req: Request, res: Response) => {
    const { chatId } = req.query;
    console.log(`GET /api/wishlists (chatId: ${chatId || 'all'})`);
    try {
        if (chatId && typeof chatId === 'string') {
            const wishlist = await prisma.wishlist.findUnique({
                where: { chatId },
                include: { items: { orderBy: { createdAt: 'desc' } } }
            });
            if (wishlist) {
                res.json(wishlist);
            } else {
                res.status(404).json({ message: `Wishlist for chat ${chatId} not found` });
            }
        } else {
            const wishlists = await prisma.wishlist.findMany({
                include: { items: { orderBy: { createdAt: 'desc' } } }
            });
            res.json(wishlists);
        }
    } catch (error) {
        console.error("Error fetching wishlists:", error);
        res.status(500).json({ message: "Failed to fetch wishlists" });
    }
});

// Создать/получить вишлист
app.post('/api/wishlists', async (req: Request, res: Response) => {
    const { chatId } = req.body;
    console.log(`POST /api/wishlists (chatId: ${chatId})`);
    if (!chatId || typeof chatId !== 'string') {
        return res.status(400).json({ message: "chatId is required" });
    }
    try {
        const wishlist = await prisma.wishlist.upsert({
            where: { chatId: chatId },
            update: {},
            create: { chatId: chatId },
            include: { items: { orderBy: { createdAt: 'desc' } } }
        });
        console.log(`Upserted wishlist for chatId: ${chatId}, ID: ${wishlist.id}`);
        res.status(200).json(wishlist);
    } catch (error) {
        console.error("Error creating/finding wishlist:", error);
        res.status(500).json({ message: "Failed to create/find wishlist" });
    }
});

// --- Маршруты для WishlistItem ---

// Добавить элемент
app.post('/api/wishlists/:wishlistId/items', async (req: Request, res: Response) => {
    const { wishlistId } = req.params;
    const { title, description, link, imageUrl } = req.body;
    console.log(`POST /api/wishlists/${wishlistId}/items`);

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: "Item title required" });
    }
    try {
        const listExists = await prisma.wishlist.findUnique({ where: { id: wishlistId } });
        if (!listExists) {
             return res.status(404).json({ message: `Wishlist ${wishlistId} not found` });
        }
        const newItem = await prisma.wishlistItem.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                link: link?.trim() || null,
                imageUrl: imageUrl?.trim() || null,
                wishlistId: wishlistId
            }
        });
        console.log(`Added item ${newItem.id} to wishlist ${wishlistId}`);
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ message: "Failed to add item" });
    }
});

// Обновить элемент (резерв/покупка)
app.patch('/api/wishlist-items/:itemId', async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { isReserved, reservedBy, isBought } = req.body;
    console.log(`PATCH /api/wishlist-items/${itemId}`);

    const dataToUpdate: Partial<Prisma.WishlistItemUpdateInput> = {};
    if (isReserved !== undefined) {
        if (typeof isReserved !== 'boolean') return res.status(400).json({ message: "isReserved must be a boolean" });
        dataToUpdate.isReserved = isReserved;
        if (isReserved === false) dataToUpdate.reservedBy = null;
    }
    if (isBought !== undefined) {
        if (typeof isBought !== 'boolean') return res.status(400).json({ message: "isBought must be a boolean" });
        dataToUpdate.isBought = isBought;
    }
    if (reservedBy !== undefined && dataToUpdate.isReserved !== false) {
        // Разрешаем передавать null для сброса reservedBy, если нужно (хотя isReserved=false это уже делает)
        if (reservedBy !== null && typeof reservedBy !== 'string') {
             return res.status(400).json({ message: "reservedBy must be string or null" });
        }
        dataToUpdate.reservedBy = reservedBy;
    }

    if (Object.keys(dataToUpdate).length === 0) {
         return res.status(400).json({ message: "No valid update data provided" });
    }

    try {
        const updatedItem = await prisma.wishlistItem.update({
            where: { id: itemId },
            data: dataToUpdate
        });
        console.log(`Updated item ${itemId}:`, dataToUpdate);
        res.json(updatedItem);
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            console.warn(`Attempted to update non-existent item: ${itemId}`);
            return res.status(404).json({ message: `Item ${itemId} not found` });
         }
         console.error("Error updating item:", error);
         res.status(500).json({ message: "Failed to update item" });
    }
});


// Удалить элемент
app.delete('/api/wishlist-items/:itemId', async (req: Request, res: Response) => {
    const { itemId } = req.params;
    console.log(`DELETE /api/wishlist-items/${itemId}`);

    try {
        await prisma.wishlistItem.delete({
            where: { id: itemId }
        });
        console.log(`Deleted item ${itemId}`);
        res.status(204).send();
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             console.warn(`Attempted to delete non-existent item: ${itemId}`);
             return res.status(404).json({ message: `Item ${itemId} not found` });
         }
         console.error("Error deleting item:", error);
         res.status(500).json({ message: "Failed to delete item" });
    }
});


// --- Запуск сервера и обработка завершения ---
// Используем переменную PORT от Render (или 10000 локально, если не задана)
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});

const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));