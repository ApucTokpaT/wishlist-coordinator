// frontend/src/components/WishlistDisplay.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Импортируем Axios

// Определим тип для элемента вишлиста (повторяем структуру из Prisma)
interface WishlistItem {
    id: string;
    title: string;
    description: string | null;
    link: string | null;
    imageUrl: string | null;
    isReserved: boolean;
    reservedBy: string | null;
    isBought: boolean;
    createdAt: string; // Даты обычно приходят как строки ISO
    updatedAt: string;
}

// Определим тип для самого вишлиста
interface Wishlist {
    id: string;
    chatId: string;
    createdAt: string;
    updatedAt: string;
    items: WishlistItem[]; // Массив элементов
}

const WishlistDisplay: React.FC = () => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // --- Для примера возьмем ID чата жестко, позже это будет динамически ---
    const currentChatId = 'test-chat-123'; 
    // ---------------------------------------------------------------------

    useEffect(() => {
        const fetchWishlist = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- ДЕЛАЕМ ЗАПРОС К API ---
                // Используем относительный путь '/api/wishlists' благодаря прокси Vite
                // Мы ищем вишлист по chatId ИЛИ создаем его, если нет (логика в бэкенде POST /api/wishlists)
                const response = await axios.post<Wishlist>('/api/wishlists', { chatId: currentChatId }); 
                
                setWishlist(response.data); // Сохраняем полученные данные в state
            } catch (err) {
                console.error("Error fetching wishlist:", err);
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                     setError(`Wishlist for chat ${currentChatId} not found.`);
                } else {
                    setError('Failed to load wishlist. Please try again later.');
                }
                setWishlist(null); // Очищаем вишлист в случае ошибки
            } finally {
                setLoading(false); // Убираем индикатор загрузки
            }
        };

        fetchWishlist(); // Вызываем функцию при монтировании компонента
    }, [currentChatId]); // Зависимость от chatId, если он будет меняться

    // --- Отображение ---
    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading wishlist...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    if (!wishlist) {
        return <div className="p-4 text-center text-gray-500">No wishlist data available.</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">
                Wishlist for Chat: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{wishlist.chatId}</span>
            </h2>

            {wishlist.items.length === 0 ? (
                <p className="text-gray-600">This wishlist is empty. Add some items!</p>
            ) : (
                <ul className="space-y-3">
                    {wishlist.items.map((item) => (
                        <li key={item.id} className="p-3 border rounded-md shadow-sm bg-white">
                            <h3 className="font-medium text-lg">{item.title}</h3>
                            {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                            {item.link && (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 text-sm mt-1 block truncate"
                                >
                                    {item.link}
                                </a>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                                <span>Status: {item.isBought ? 'Bought' : item.isReserved ? `Reserved` : 'Available'}</span>
                                {/* Позже добавим кнопки Reserve/Mark as Bought */}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Позже здесь будет форма добавления нового элемента */}
            <div className="mt-6">
                 <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                     Add New Item (soon)
                 </button>
             </div>
        </div>
    );
};

export default WishlistDisplay;