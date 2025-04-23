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
    reservedBy: string | null;
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

// --- Пропсы компонента ---
interface WishlistDisplayProps {
    chatId: string;         // Получаем реальный chatId
    currentUserId: string;  // Получаем реальный userId (как строку)
}
// --- /Пропсы компонента ---


const WishlistDisplay: React.FC<WishlistDisplayProps> = ({ chatId, currentUserId }) => { // Используем пропсы
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Убрали currentChatId и SIMULATED_USER_ID - теперь они в пропсах

    // --- Получение данных ---
    useEffect(() => {
        // Перезагружаем вишлист, если chatId изменился
        if (!chatId) return; // Не делаем запрос, если chatId еще не пришел

        const fetchWishlist = async () => {
            setLoading(true);
            setError(null);
            try {
                // Используем chatId из пропсов
                const response = await axios.post<Wishlist>('/api/wishlists', { chatId: chatId });
                setWishlist(response.data);
            } catch (err) {
                console.error("Error fetching wishlist for chat", chatId, ":", err);
                // Можно добавить более специфичную обработку ошибок, если бэкенд возвращает 404
                setError('Failed to load wishlist.');
                setWishlist(null);
            } finally {
                setLoading(false);
            }
        };
        fetchWishlist();
    }, [chatId]); // Зависимость от chatId

    // --- Обработчики ---
    const updateItemInState = (updatedItem: WishlistItem) => {
        setWishlist(prev => prev ? { ...prev, items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item) } : null);
    };

    const handleAddItem = (newItem: WishlistItem) => {
        setWishlist(prev => prev ? { ...prev, items: [newItem, ...prev.items] } : null);
    };

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

    const handleReserve = async (itemId: string) => {
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;
        const originalWishlist = wishlist;
        setError(null);
        // Используем currentUserId из пропсов
        updateItemInState({ ...item, isReserved: true, reservedBy: currentUserId });
        try {
            const response = await axios.patch<WishlistItem>(`/api/wishlist-items/${itemId}`, {
                isReserved: true,
                reservedBy: currentUserId // Отправляем реальный ID пользователя
            });
            updateItemInState(response.data);
        } catch (err) {
            console.error(`Error reserving item ${itemId}:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to reserve "${item.title}".`);
        }
    };

    const handleUnreserve = async (itemId: string) => {
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;
         // Используем currentUserId из пропсов для проверки
         if (item.reservedBy !== currentUserId) {
            // Можно использовать WebApp.showAlert() для нативного уведомления
            alert("You can only unreserve items reserved by you."); 
            return;
         }
        const originalWishlist = wishlist;
        setError(null);
        updateItemInState({ ...item, isReserved: false, reservedBy: null });
        try {
            const response = await axios.patch<WishlistItem>(`/api/wishlist-items/${itemId}`, {
                isReserved: false,
                reservedBy: null
            });
            updateItemInState(response.data);
        } catch (err) {
            console.error(`Error unreserving item ${itemId}:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to unreserve "${item.title}".`);
        }
    };

    const handleMarkAsBought = async (itemId: string) => {
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item || item.isBought) return;
        // Можно использовать WebApp.showConfirm() для нативного подтверждения
        if (!window.confirm(`Mark "${item.title}" as bought?`)) return;
        const originalWishlist = wishlist;
        setError(null);
        updateItemInState({ ...item, isBought: true, isReserved: true }); // Отмечаем и резервируем
        try {
            const response = await axios.patch<WishlistItem>(`/api/wishlist-items/${itemId}`, {
                 isBought: true,
                 isReserved: true // Обновляем оба поля
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
        return <div className="p-4 text-center" style={{ color: 'var(--hint-color, #999999)' }}>Loading wishlist...</div>;
    }
    if (error && !wishlist) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }
    if (!wishlist) {
        // Если chatId есть, но вишлист не загрузился (например, 404 от бэкенда, но не ошибка сети)
         return <div className="p-4 text-center" style={{ color: 'var(--hint-color, #999999)' }}>Wishlist not found or empty. Use the form to add items.</div>;
    }

    return (
        // Обертка теперь не нужна, т.к. стили применяются в App.tsx
        <> 
            {/* Заголовок с реальным chatId */}
            <h2 className="text-xl font-semibold mb-4 px-4 pt-4"> 
                Wishlist for Chat: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{wishlist.chatId}</span>
            </h2>

            <AddItemForm wishlistId={wishlist.id} onItemAdded={handleAddItem} />

            {error && wishlist && (
                 <div className="mt-4 mx-4 p-2 text-sm text-red-700 bg-red-100 rounded-md">
                     {error}
                 </div>
             )}

            {/* --- Список элементов --- */}
            <div className="mt-6 px-4 pb-4">
                <h3 className="text-lg font-medium mb-3">Items:</h3>
                {wishlist.items.length === 0 ? (
                     <p className="text-sm" style={{ color: 'var(--hint-color, #999999)' }}>This wishlist is empty...</p>
                ) : (
                    <ul className="space-y-3">
                        {wishlist.items.map((item) => {
                             // Используем реальный currentUserId из пропсов
                             const isReservedByCurrentUser = item.isReserved && item.reservedBy === currentUserId;
                             const canInteractWithReserve = !item.isBought && (!item.isReserved || isReservedByCurrentUser);

                            return (
                                <li key={item.id} className={`p-3 border rounded-md shadow-sm transition duration-150 ease-in-out hover:shadow-md ${item.isBought ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : item.isReserved ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                    {/* ... (отображение title, description, link, imageUrl) ... */}
                                     <div className="flex justify-between items-start">
                                      <div>
                                          <h4 className="font-medium text-lg">{item.title}</h4>
                                          {item.description && <p className="text-sm mt-1" style={{ color: 'var(--second-text-color, #666)' }}>{item.description}</p>}
                                          {item.link && (
                                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm mt-1 block truncate max-w-xs md:max-w-md" style={{ color: 'var(--link-color, #2481cc)' }}>
                                                  {item.link}
                                              </a>
                                          )}
                                      </div>
                                       {item.imageUrl && (
                                          <img src={item.imageUrl} alt={item.title} className="ml-4 w-16 h-16 object-cover rounded flex-shrink-0 border dark:border-gray-600" />
                                      )}
                                  </div>

                                    {/* --- Статус и кнопки --- */}
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs" style={{ color: 'var(--hint-color, #999999)' }}>
                                        {/* Статус */}
                                         <span className={`font-medium ${item.isBought ? 'text-green-700 dark:text-green-400' : item.isReserved ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                                            Status: {item.isBought ? '🎁 Bought' : item.isReserved ? `🔒 Reserved ${isReservedByCurrentUser ? '(by You)' : ''}` : '🟢 Available'}
                                        </span>

                                        {/* Кнопки */}
                                        <div className="mt-2 sm:mt-0 space-x-2 flex-shrink-0">
                                            {/* Кнопка Reserve/Unreserve */}
                                            {canInteractWithReserve && !item.isReserved && (
                                                <button onClick={() => handleReserve(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:ring-yellow-500" title="Reserve">
                                                    Reserve
                                                </button>
                                            )}
                                            {isReservedByCurrentUser && !item.isBought && (
                                                <button onClick={() => handleUnreserve(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500" title="Unreserve">
                                                    Unreserve
                                                </button>
                                            )}
                                            {/* Кнопка Mark as Bought */}
                                             {!item.isBought && (
                                                 <button onClick={() => handleMarkAsBought(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 focus:ring-green-500" title="Mark Bought">
                                                     Mark Bought
                                                 </button>
                                             )}
                                             {/* Кнопка Delete */}
                                             {!item.isBought && ( // Пока не даем удалять купленное
                                                 <button onClick={() => handleDeleteItem(item.id, item.title)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 focus:ring-red-500" title="Delete">
                                                     Delete
                                                 </button>
                                             )}
                                        </div>
                                    </div>
                                    {/* --- /Статус и кнопки --- */}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
             {/* --- /Список элементов --- */}
        </> // Используем React Fragment вместо div
    );
};

export default WishlistDisplay;