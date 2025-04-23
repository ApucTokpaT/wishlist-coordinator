// frontend/src/components/WishlistDisplay.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddItemForm from './AddItemForm';

// --- Типы данных ---
export interface WishlistItem {
    id: string;
    title: string;
    description: string | null;
    link: string | null;
    imageUrl: string | null;
    isReserved: boolean;
    reservedBy: string | null; // ID пользователя, зарезервировавшего
    isBought: boolean;
    createdAt: string;
    updatedAt: string;
    wishlistId: string;
}

interface Wishlist {
    id: string;
    chatId: string;
    createdAt: string;
    updatedAt: string;
    items: WishlistItem[];
}
// --- /Типы данных ---

// !!! Симулируем ID текущего пользователя (позже будет из Telegram) !!!
const SIMULATED_USER_ID = 'user-self-123'; 
// --------------------------------------------------------------------


const WishlistDisplay: React.FC = () => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const currentChatId = 'test-chat-123'; // Жестко заданный ID чата

    // --- Получение данных ---
    useEffect(() => {
        const fetchWishlist = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.post<Wishlist>('/api/wishlists', { chatId: currentChatId });
                setWishlist(response.data);
            } catch (err) {
                console.error("Error fetching wishlist:", err);
                setError('Failed to load wishlist.'); // Упрощенная ошибка
                setWishlist(null);
            } finally {
                setLoading(false);
            }
        };
        fetchWishlist();
    }, [currentChatId]);

    // --- Обработчики действий с элементом ---

    // Общая функция для обновления элемента в state
    const updateItemInState = (updatedItem: WishlistItem) => {
        setWishlist(prev => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item)
            };
        });
    };
    
    // Обработчик добавления
    const handleAddItem = (newItem: WishlistItem) => {
        setWishlist(prev => prev ? { ...prev, items: [newItem, ...prev.items] } : null);
    };

    // Обработчик удаления
    const handleDeleteItem = async (itemId: string, itemTitle: string) => {
        if (!window.confirm(`Delete "${itemTitle}"?`)) return;
        const originalWishlist = wishlist;
        setError(null);
        setWishlist(prev => prev ? { ...prev, items: prev.items.filter(item => item.id !== itemId) } : null);
        try {
            await axios.delete(`/api/wishlist-items/${itemId}`);
        } catch (err) {
            console.error(`Error deleting item ${itemId}:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to delete "${itemTitle}".`);
        }
    };

    // Обработчик резервирования
    const handleReserve = async (itemId: string) => {
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;

        const originalWishlist = wishlist;
        setError(null);
        
        // Оптимистичное обновление
        updateItemInState({ ...item, isReserved: true, reservedBy: SIMULATED_USER_ID });

        try {
            const response = await axios.patch<WishlistItem>(`/api/wishlist-items/${itemId}`, {
                isReserved: true,
                reservedBy: SIMULATED_USER_ID 
            });
             updateItemInState(response.data); // Обновляем данными с сервера (на случай если там что-то изменилось еще)
        } catch (err) {
            console.error(`Error reserving item ${itemId}:`, err);
            setWishlist(originalWishlist); // Откат
            setError(`Failed to reserve "${item.title}".`);
        }
    };

    // Обработчик снятия резерва
    const handleUnreserve = async (itemId: string) => {
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;

         // Проверка: только тот, кто зарезервировал, может снять резерв
         if (item.reservedBy !== SIMULATED_USER_ID) {
            alert("You cannot unreserve an item reserved by someone else."); // Простое уведомление
            return;
         }

        const originalWishlist = wishlist;
        setError(null);
        updateItemInState({ ...item, isReserved: false, reservedBy: null }); // Оптимистичное обновление

        try {
            const response = await axios.patch<WishlistItem>(`/api/wishlist-items/${itemId}`, {
                isReserved: false,
                reservedBy: null // Явно отправляем null
            });
            updateItemInState(response.data);
        } catch (err) {
            console.error(`Error unreserving item ${itemId}:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to unreserve "${item.title}".`);
        }
    };
    
    // Обработчик отметки "Куплено"
    const handleMarkAsBought = async (itemId: string) => {
        const item = wishlist?.items.find(i => i.id === itemId);
         if (!item || item.isBought) return; // Не делаем ничего, если уже куплено

        if (!window.confirm(`Mark "${item.title}" as bought? This cannot be easily undone.`)) return;
        
        const originalWishlist = wishlist;
        setError(null);
        // Оптимистичное обновление (также ставим isReserved=true, если еще не было)
        updateItemInState({ ...item, isBought: true, isReserved: true }); 

        try {
            const response = await axios.patch<WishlistItem>(`/api/wishlist-items/${itemId}`, {
                 isBought: true,
                 isReserved: true // Можно отправлять isReserved тоже, если бэкенд это учитывает
            });
            updateItemInState(response.data);
        } catch (err) {
            console.error(`Error marking item ${itemId} as bought:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to mark "${item.title}" as bought.`);
        }
    };

    // --- /Обработчики ---


    // --- Отображение ---
    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading wishlist...</div>;
    }
    if (error && !wishlist) {
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

            <AddItemForm wishlistId={wishlist.id} onItemAdded={handleAddItem} />

            {error && wishlist && (
                 <div className="mt-4 p-2 text-sm text-red-700 bg-red-100 rounded-md">
                     {error}
                 </div>
             )}

            {/* --- Список элементов --- */}
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Items:</h3>
                {wishlist.items.length === 0 ? (
                    <p className="text-gray-600">This wishlist is empty...</p>
                ) : (
                    <ul className="space-y-3">
                        {wishlist.items.map((item) => {
                             // Определяем, может ли текущий пользователь взаимодействовать с резервом
                             const canInteractWithReserve = !item.isBought && (!item.isReserved || item.reservedBy === SIMULATED_USER_ID);
                             const isReservedByCurrentUser = item.isReserved && item.reservedBy === SIMULATED_USER_ID;

                            return (
                                <li key={item.id} className={`p-3 border rounded-md shadow-sm transition duration-150 ease-in-out hover:shadow-md ${item.isBought ? 'bg-green-50' : item.isReserved ? 'bg-yellow-50' : 'bg-white'}`}>
                                    {/* ... (код отображения title, description, link, imageUrl - без изменений) ... */}
                                    <div className="flex justify-between items-start">
                                      <div>
                                          <h4 className="font-medium text-lg">{item.title}</h4>
                                          {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                                          {item.link && (
                                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-sm mt-1 block truncate max-w-xs md:max-w-md">
                                                  {item.link}
                                              </a>
                                          )}
                                      </div>
                                       {item.imageUrl && (
                                          <img src={item.imageUrl} alt={item.title} className="ml-4 w-16 h-16 object-cover rounded flex-shrink-0" />
                                      )}
                                  </div>

                                    {/* --- Статус и кнопки действий --- */}
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-gray-500">
                                        {/* Статус */}
                                        <span className={`font-medium ${item.isBought ? 'text-green-700' : item.isReserved ? 'text-yellow-700' : 'text-gray-600'}`}>
                                            Status: {item.isBought ? '🎁 Bought' : item.isReserved ? `🔒 Reserved ${item.reservedBy === SIMULATED_USER_ID ? '(by You)' : ''}` : '🟢 Available'}
                                            {/* TODO: Позже можно добавить имя пользователя вместо ID, если оно будет доступно */}
                                        </span>

                                        {/* Кнопки */}
                                        <div className="mt-2 sm:mt-0 space-x-2 flex-shrink-0">
                                             {/* Кнопка Reserve/Unreserve */}
                                             {canInteractWithReserve && !item.isReserved && (
                                                <button
                                                    onClick={() => handleReserve(item.id)}
                                                    className="px-2 py-1 text-xs text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                                                    title="Reserve this item"
                                                >
                                                    Reserve
                                                </button>
                                            )}
                                             {isReservedByCurrentUser && !item.isBought && (
                                                <button
                                                    onClick={() => handleUnreserve(item.id)}
                                                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                                    title="Cancel your reservation"
                                                >
                                                    Unreserve
                                                </button>
                                            )}

                                            {/* Кнопка Mark as Bought (показываем, если не куплено) */}
                                            {!item.isBought && (
                                                <button
                                                     onClick={() => handleMarkAsBought(item.id)}
                                                     className="px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                                                     title="Mark this item as bought"
                                                >
                                                    Mark Bought
                                                </button>
                                            )}

                                            {/* Кнопка Delete (показываем всегда, если не куплено? Или только для админа/создателя? Пока всегда) */}
                                             {!item.isBought && (
                                                 <button
                                                     onClick={() => handleDeleteItem(item.id, item.title)}
                                                     className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                     title="Delete this item"
                                                 >
                                                     Delete
                                                 </button>
                                             )}
                                        </div>
                                    </div>
                                    {/* --- /Статус и кнопки действий --- */}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
             {/* --- /Список элементов --- */}
        </div>
    );
};

export default WishlistDisplay;