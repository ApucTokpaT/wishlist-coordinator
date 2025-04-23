// frontend/src/components/WishlistDisplay.tsx
import React, { useState, useEffect } from 'react'; // Убрали React
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
    reservedBy: string | null; 
    isBought: boolean;
    createdAt: string;
    updatedAt: string;
    wishlistId: string;
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
    currentUserName: string; 
    birthdayPersonUserId: string; 
}
// --- /Пропсы компонента ---


const WishlistDisplay: React.FC<WishlistDisplayProps> = ({ chatId, currentUserId, currentUserName, birthdayPersonUserId }) => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const isCurrentUserBirthdayPerson = currentUserId === birthdayPersonUserId;

    // --- Получение данных ---
     useEffect(() => {
        if (!chatId) return;
        const fetchWishlist = async () => { 
             setLoading(true);
             setError(null);
             try {
                 const response = await axios.post<Wishlist>(`${API_BASE_URL}/api/wishlists`, { chatId: chatId });
                 // Добавляем имена к загруженным данным, если резервировал текущий юзер
                 const itemsWithNames = response.data.items.map(item => ({
                     ...item,
                     reservedByName: item.reservedBy === currentUserId ? currentUserName : null
                 }));
                 setWishlist({ ...response.data, items: itemsWithNames });

             } catch (err) {
                 console.error("Error fetching wishlist for chat", chatId, ":", err);
                 setError('Failed to load wishlist.');
                 setWishlist(null);
             } finally {
                 setLoading(false);
             }
         };
         fetchWishlist();
     }, [chatId, currentUserName, currentUserId]); // Добавили зависимости

    // --- Обработчики ---
    const updateItemInState = (updatedItem: WishlistItem) => {
         if (updatedItem.isReserved && updatedItem.reservedBy === currentUserId && !updatedItem.reservedByName) {
             updatedItem.reservedByName = currentUserName;
         } else if (!updatedItem.isReserved) {
             updatedItem.reservedByName = null;
         }
        setWishlist(prev => prev ? { ...prev, items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item) } : null);
    };

    const handleAddItem = (newItem: WishlistItem) => { 
         // Добавляем имя, если новый элемент как-то связан с текущим юзером (маловероятно при добавлении)
         const newItemWithName = {
             ...newItem,
             reservedByName: newItem.reservedBy === currentUserId ? currentUserName : null
         };
         setWishlist(prev => prev ? { ...prev, items: [newItemWithName, ...prev.items] } : null);
    };

    const handleDeleteItem = async (itemId: string, itemTitle: string) => { 
        console.log(`[DeleteItem ${itemId}] Start`); // <-- ЛОГ 1
        if (!window.confirm(`Delete "${itemTitle}"?`)) {
            console.log(`[DeleteItem ${itemId}] Confirmation cancelled.`); // <-- ЛОГ 2
            return;
        }
        const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null; // Глубокое копирование для отката
        setError(null);
        
        console.log(`[DeleteItem ${itemId}] Updating state optimistically...`); // <-- ЛОГ 3
        setWishlist(prev => prev ? { ...prev, items: prev.items.filter(item => item.id !== itemId) } : null);
        
        try {
            console.log(`[DeleteItem ${itemId}] Sending DELETE request...`); // <-- ЛОГ 4
            await axios.delete(`${API_BASE_URL}/api/wishlist-items/${itemId}`);
            console.log(`[DeleteItem ${itemId}] DELETE request successful.`); // <-- ЛОГ 5
        } catch (err) {
            console.error(`[DeleteItem ${itemId}] Error deleting item:`, err); // <-- ЛОГ ОШИБКИ
            setWishlist(originalWishlist); // Откат к сохраненному состоянию
            setError(`Failed to delete "${itemTitle}".`);
        }
        console.log(`[DeleteItem ${itemId}] End`); // <-- ЛОГ 6
     };

    const handleReserve = async (itemId: string) => { 
        console.log(`[ReserveItem ${itemId}] Start`);
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;
        const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null;
        setError(null);
        
        console.log(`[ReserveItem ${itemId}] Updating state optimistically...`);
        updateItemInState({ ...item, isReserved: true, reservedBy: currentUserId, reservedByName: currentUserName }); 
        
        try {
            console.log(`[ReserveItem ${itemId}] Sending PATCH request...`);
            const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                isReserved: true,
                reservedBy: currentUserId 
            });
            console.log(`[ReserveItem ${itemId}] PATCH successful. Updating state...`);
            updateItemInState({ ...response.data, reservedByName: response.data.reservedBy === currentUserId ? currentUserName : null });
            console.log(`[ReserveItem ${itemId}] State updated.`);
        } catch (err) {
            console.error(`[ReserveItem ${itemId}] Error reserving item:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to reserve "${item.title}".`);
        }
        console.log(`[ReserveItem ${itemId}] End`);
     };

    const handleUnreserve = async (itemId: string) => { 
        console.log(`[UnreserveItem ${itemId}] Start`);
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;
         if (item.reservedBy !== currentUserId) {
             alert("You can only unreserve items reserved by you."); 
             return;
         }
        const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null;
        setError(null);
        
        console.log(`[UnreserveItem ${itemId}] Updating state optimistically...`);
        updateItemInState({ ...item, isReserved: false, reservedBy: null, reservedByName: null });
        
        try {
             console.log(`[UnreserveItem ${itemId}] Sending PATCH request...`);
            const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                isReserved: false,
                reservedBy: null
            });
            console.log(`[UnreserveItem ${itemId}] PATCH successful. Updating state...`);
            updateItemInState(response.data);
            console.log(`[UnreserveItem ${itemId}] State updated.`);
        } catch (err) {
            console.error(`[UnreserveItem ${itemId}] Error unreserving item:`, err);
            setWishlist(originalWishlist);
            setError(`Failed to unreserve "${item.title}".`);
        }
         console.log(`[UnreserveItem ${itemId}] End`);
     };

    const handleMarkAsBought = async (itemId: string) => { 
        console.log(`[MarkBought ${itemId}] Start`); // <-- ЛОГ 1
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item || item.isBought) {
             console.log(`[MarkBought ${itemId}] Already bought or item not found.`); // <-- ЛОГ 2
             return;
        }
        if (!window.confirm(`Mark "${item.title}" as bought?`)) {
             console.log(`[MarkBought ${itemId}] Confirmation cancelled.`); // <-- ЛОГ 3
             return;
        }
        const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null; // Глубокое копирование для отката
        setError(null);
         const finalReservedById = item.isReserved ? (item.reservedBy ?? currentUserId) : currentUserId;
         const finalReservedByName = item.isReserved ? (item.reservedByName ?? currentUserName) : currentUserName;

        console.log(`[MarkBought ${itemId}] Updating state optimistically...`); // <-- ЛОГ 4
        updateItemInState({ ...item, isBought: true, isReserved: true, reservedBy: finalReservedById, reservedByName: finalReservedByName }); 
        
        try {
            console.log(`[MarkBought ${itemId}] Sending PATCH request...`); // <-- ЛОГ 5
            const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                 isBought: true,
                 isReserved: true, 
                 reservedBy: finalReservedById 
            });
             console.log(`[MarkBought ${itemId}] PATCH request successful. Updating state with server data...`); // <-- ЛОГ 6
             // Убедимся, что имя текущего пользователя сохранилось, если он покупал/резервировал
             const serverData = response.data;
             const finalName = serverData.reservedBy === currentUserId ? currentUserName : null; // Имя только если текущий юзер = reservedBy
             updateItemInState({ ...serverData, reservedByName: finalName }); 
             console.log(`[MarkBought ${itemId}] State updated with server data.`); // <-- ЛОГ 7
        } catch (err) {
            console.error(`[MarkBought ${itemId}] Error marking item as bought:`, err); // <-- ЛОГ ОШИБКИ
            setWishlist(originalWishlist); // Откат к сохраненному состоянию
            setError(`Failed to mark "${item.title}" as bought.`);
        }
        console.log(`[MarkBought ${itemId}] End`); // <-- ЛОГ 8
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
         return <div className="p-4 text-center" style={{ color: 'var(--hint-color, #999999)' }}>Wishlist not found or empty. Use the form to add items.</div>;
    }

    return (
        <> 
            <h2 className="text-xl font-semibold mb-4 px-4 pt-4"> 
                Wishlist for Chat: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{wishlist.chatId}</span>
                {isCurrentUserBirthdayPerson && <span className="ml-2 text-sm font-normal text-yellow-500">(This is your list!)</span>}
            </h2>

            <AddItemForm wishlistId={wishlist.id} onItemAdded={handleAddItem} />

             {error && wishlist && ( 
                 <div className="mt-4 mx-4 p-2 text-sm text-red-700 bg-red-100 rounded-md">
                     {error}
                 </div>
             )}

            <div className="mt-6 px-4 pb-4">
                <h3 className="text-lg font-medium mb-3">Items:</h3>
                {wishlist.items.length === 0 ? ( 
                     <p className="text-sm" style={{ color: 'var(--hint-color, #999999)' }}>This wishlist is empty...</p>
                 ) : (
                    <ul className="space-y-3">
                        {wishlist.items.map((item) => {
                             const isReservedByCurrentUser = item.isReserved && item.reservedBy === currentUserId;
                             const canInteractWithReserve = !isCurrentUserBirthdayPerson && !item.isBought && (!item.isReserved || isReservedByCurrentUser);
                             const canMarkAsBought = !isCurrentUserBirthdayPerson && !item.isBought;
                             const canDelete = !isCurrentUserBirthdayPerson && !item.isBought;

                            return (
                                <li key={item.id} className={`p-3 border rounded-md shadow-sm transition duration-150 ease-in-out hover:shadow-md ${item.isBought ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : item.isReserved ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
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
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs" style={{ color: 'var(--hint-color, #999999)' }}>
                                         <span className={`font-medium ${item.isBought ? 'text-green-700 dark:text-green-400' : item.isReserved ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                                            Status: {item.isBought ? '🎁 Bought' : 
                                                     item.isReserved ? `🔒 Reserved ${isCurrentUserBirthdayPerson ? '' : (isReservedByCurrentUser ? `(by ${item.reservedByName || 'You'})` : '(by someone)')}` : 
                                                     '🟢 Available'}
                                        </span>
                                        <div className="mt-2 sm:mt-0 space-x-2 flex-shrink-0">
                                            {canInteractWithReserve && !item.isReserved && (
                                                <button onClick={() => handleReserve(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:ring-yellow-500" title="Reserve"> Reserve </button>
                                            )}
                                            {canInteractWithReserve && isReservedByCurrentUser && (
                                                <button onClick={() => handleUnreserve(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500" title="Unreserve"> Unreserve </button>
                                            )}
                                             {canMarkAsBought && (
                                                 <button onClick={() => handleMarkAsBought(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 focus:ring-green-500" title="Mark Bought"> Mark Bought </button>
                                             )}
                                             {canDelete && ( 
                                                 <button onClick={() => handleDeleteItem(item.id, item.title)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 focus:ring-red-500" title="Delete"> Delete </button>
                                             )}
                                        </div>
                                    </div>
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