// frontend/src/components/WishlistDisplay.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddItemForm from './AddItemForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

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
     // Добавим опциональное поле для имени (если решим получать его с бэка)
     reservedByName?: string | null; 
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
    chatId: string;
    currentUserId: string;
    currentUserName: string; // Имя текущего пользователя
    birthdayPersonUserId: string; // ID "именинника"
}
// --- /Пропсы компонента ---


const WishlistDisplay: React.FC<WishlistDisplayProps> = ({ chatId, currentUserId, currentUserName, birthdayPersonUserId }) => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Определяем, является ли текущий пользователь именинником
    const isCurrentUserBirthdayPerson = currentUserId === birthdayPersonUserId;

    // --- Получение данных (без изменений) ---
     useEffect(() => {
        if (!chatId) return;
        const fetchWishlist = async () => { /* ... код без изменений ... */ 
             setLoading(true);
             setError(null);
             try {
                 const response = await axios.post<Wishlist>(`${API_BASE_URL}/api/wishlists`, { chatId: chatId });
                 setWishlist(response.data);
             } catch (err) {
                 console.error("Error fetching wishlist for chat", chatId, ":", err);
                 setError('Failed to load wishlist.');
                 setWishlist(null);
             } finally {
                 setLoading(false);
             }
         };
         fetchWishlist();
     }, [chatId]);

    // --- Обработчики ---
    const updateItemInState = (updatedItem: WishlistItem) => {
        // Добавляем имя текущего пользователя при резервировании в state
         if (updatedItem.isReserved && updatedItem.reservedBy === currentUserId && !updatedItem.reservedByName) {
             updatedItem.reservedByName = currentUserName;
         } else if (!updatedItem.isReserved) {
             updatedItem.reservedByName = null; // Очищаем имя при снятии резерва
         }
        setWishlist(prev => prev ? { ...prev, items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item) } : null);
    };

    const handleAddItem = (newItem: WishlistItem) => { /* ... код без изменений ... */ 
         setWishlist(prev => prev ? { ...prev, items: [newItem, ...prev.items] } : null);
    };

    const handleDeleteItem = async (itemId: string, itemTitle: string) => { /* ... код без изменений ... */ 
        if (!window.confirm(`Delete "${itemTitle}"?`)) return;
        const originalWishlist = wishlist;
        setError(null);
        setWishlist(prev => prev ? { ...prev, items: prev.items.filter(item => item.id !== itemId) } : null);
        try {
            await axios.delete(`${API_BASE_URL}/api/wishlist-items/${itemId}`);
        } catch (err) {
            console.error(`Error deleting item ${itemId}:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to delete "${itemTitle}".`);
        }
     };

    const handleReserve = async (itemId: string) => { /* ... код без изменений, использует currentUserId ... */
         const item = wishlist?.items.find(i => i.id === itemId);
         if (!item) return;
         const originalWishlist = wishlist;
         setError(null);
         updateItemInState({ ...item, isReserved: true, reservedBy: currentUserId, reservedByName: currentUserName }); // Обновляем и имя в state
         try {
             const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                 isReserved: true,
                 reservedBy: currentUserId 
             });
             // Обновляем данными с сервера, но сохраняем имя из state, если с сервера оно не пришло
             updateItemInState({ ...response.data, reservedByName: response.data.reservedBy === currentUserId ? currentUserName : null });
         } catch (err) {
             console.error(`Error reserving item ${itemId}:`, err);
             setWishlist(originalWishlist);
             setError(`Failed to reserve "${item.title}".`);
         }
     };

    const handleUnreserve = async (itemId: string) => { /* ... код без изменений, использует currentUserId ... */
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;
         if (item.reservedBy !== currentUserId) {
             alert("You can only unreserve items reserved by you."); 
             return;
         }
        const originalWishlist = wishlist;
        setError(null);
        updateItemInState({ ...item, isReserved: false, reservedBy: null, reservedByName: null }); // Обновляем state
        try {
            const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                isReserved: false,
                reservedBy: null
            });
            updateItemInState(response.data); // Обновляем данными с сервера
        } catch (err) {
            console.error(`Error unreserving item ${itemId}:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to unreserve "${item.title}".`);
        }
     };

    const handleMarkAsBought = async (itemId: string) => { /* ... код без изменений ... */ 
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item || item.isBought) return;
        if (!window.confirm(`Mark "${item.title}" as bought?`)) return;
        const originalWishlist = wishlist;
        setError(null);
         // Если резервировал НЕ текущий юзер, при покупке сохраняем его ID в reservedBy
         const finalReservedById = item.isReserved ? (item.reservedBy ?? currentUserId) : currentUserId;
         const finalReservedByName = item.isReserved ? (item.reservedByName ?? currentUserName) : currentUserName;

        updateItemInState({ ...item, isBought: true, isReserved: true, reservedBy: finalReservedById, reservedByName: finalReservedByName }); 
        try {
            const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                 isBought: true,
                 isReserved: true, // Отмечаем резерв при покупке
                 reservedBy: finalReservedById // Сохраняем, кто купил/зарезервировал
            });
             updateItemInState({ ...response.data, reservedByName: response.data.reservedBy === currentUserId ? currentUserName : null }); // Обновляем state, сохраняя имя текущего юзера
        } catch (err) {
            console.error(`Error marking item ${itemId} as bought:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to mark "${item.title}" as bought.`);
        }
    };
    // --- /Обработчики ---


    // --- Отображение ---
    if (loading) { return /* ... */; }
    if (error && !wishlist) { return /* ... */; }
    if (!wishlist) { return /* ... */; }

    return (
        <> 
            <h2 className="text-xl font-semibold mb-4 px-4 pt-4"> 
                Wishlist for Chat: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{wishlist.chatId}</span>
                {isCurrentUserBirthdayPerson && <span className="ml-2 text-sm font-normal text-yellow-500">(This is your list!)</span>}
            </h2>

            <AddItemForm wishlistId={wishlist.id} onItemAdded={handleAddItem} />

            {error && wishlist && ( /* ... */ )}

            <div className="mt-6 px-4 pb-4">
                <h3 className="text-lg font-medium mb-3">Items:</h3>
                {wishlist.items.length === 0 ? ( /* ... */ ) : (
                    <ul className="space-y-3">
                        {wishlist.items.map((item) => {
                             const isReservedByCurrentUser = item.isReserved && item.reservedBy === currentUserId;
                             // Нельзя взаимодействовать с резервом, если ты именинник ИЛИ уже куплено
                             const canInteractWithReserve = !isCurrentUserBirthdayPerson && !item.isBought && (!item.isReserved || isReservedByCurrentUser);
                             // Кнопку "Куплено" может нажать любой (кроме именинника?), если еще не куплено
                              const canMarkAsBought = !isCurrentUserBirthdayPerson && !item.isBought;
                               // Удалять может любой (?), если не куплено
                              const canDelete = !isCurrentUserBirthdayPerson && !item.isBought;


                            return (
                                <li key={item.id} className={`p-3 border rounded-md shadow-sm transition duration-150 ease-in-out hover:shadow-md ${item.isBought ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : item.isReserved ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                    {/* ... (отображение title, description, link, imageUrl) ... */}
                                     <div className="flex justify-between items-start"> /* ... */ </div>

                                    {/* --- Статус и кнопки --- */}
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs" style={{ color: 'var(--hint-color, #999999)' }}>
                                        {/* Статус */}
                                         <span className={`font-medium ${item.isBought ? 'text-green-700 dark:text-green-400' : item.isReserved ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                                            Status: {item.isBought ? '🎁 Bought' : 
                                                     item.isReserved ? `🔒 Reserved ${isCurrentUserBirthdayPerson ? '' : (isReservedByCurrentUser ? `(by ${item.reservedByName || 'You'})` : '(by someone)')}` : 
                                                     '🟢 Available'}
                                            {/* Если именинник, просто "Reserved", если нет - показываем кем (если собой - имя/You, если другим - someone) */}
                                        </span>

                                        {/* Кнопки */}
                                        <div className="mt-2 sm:mt-0 space-x-2 flex-shrink-0">
                                            {/* Кнопка Reserve (если можно и не зарезервировано) */}
                                            {canInteractWithReserve && !item.isReserved && (
                                                <button onClick={() => handleReserve(item.id)} className="..." title="Reserve"> Reserve </button>
                                            )}
                                            {/* Кнопка Unreserve (если можно и зарезервировано текущим юзером) */}
                                            {canInteractWithReserve && isReservedByCurrentUser && (
                                                <button onClick={() => handleUnreserve(item.id)} className="..." title="Unreserve"> Unreserve </button>
                                            )}
                                            {/* Кнопка Mark as Bought */}
                                             {canMarkAsBought && (
                                                 <button onClick={() => handleMarkAsBought(item.id)} className="..." title="Mark Bought"> Mark Bought </button>
                                             )}
                                             {/* Кнопка Delete */}
                                             {canDelete && ( 
                                                 <button onClick={() => handleDeleteItem(item.id, item.title)} className="..." title="Delete"> Delete </button>
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
        </>
    );
};

export default WishlistDisplay;