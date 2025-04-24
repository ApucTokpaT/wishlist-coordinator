// frontend/src/components/WishlistDisplay.tsx
import { useState, useEffect } from 'react'; 
import axios from 'axios';
import AddItemForm from './AddItemForm'; // Убедитесь, что этот компонент существует и импортируется
import WebApp from '@twa-dev/sdk'; // Импортируем SDK для нативных уведомлений/подтверждений

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
        console.log(`[Effect] Fetching wishlist for chatId: ${chatId}`);
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
                 console.log("[Effect] Wishlist data received:", response.data);
                 setWishlist({ ...response.data, items: itemsWithNames });

             } catch (err) {
                 console.error("[Effect] Error fetching wishlist:", err);
                 let errorMsg = 'Failed to load wishlist.';
                 if (axios.isAxiosError(err) && err.response) {
                     errorMsg += ` (Status: ${err.response.status})`;
                 }
                 setError(errorMsg);
                 setWishlist(null);
             } finally {
                 setLoading(false);
             }
         };
         fetchWishlist();
     }, [chatId, currentUserName, currentUserId]); // Добавили зависимости

    // --- Обработчики ---
    const updateItemInState = (updatedItem: WishlistItem) => {
        console.log("[updateItemInState] Updating item:", updatedItem);
         // Устанавливаем имя, если текущий юзер резервирует
         if (updatedItem.isReserved && updatedItem.reservedBy === currentUserId && !updatedItem.reservedByName) {
             updatedItem.reservedByName = currentUserName;
         } 
         // Очищаем имя, если резерв снят ИЛИ если зарезервировал кто-то другой (на всякий случай)
         else if (!updatedItem.isReserved || updatedItem.reservedBy !== currentUserId) { 
             updatedItem.reservedByName = null;
         }
        setWishlist(prev => {
            if (!prev) return null;
            const updatedItems = prev.items.map(item => item.id === updatedItem.id ? updatedItem : item);
            console.log("[updateItemInState] New state items:", updatedItems);
            return { ...prev, items: updatedItems };
        });
    };

    const handleAddItem = (newItem: WishlistItem) => { 
        console.log("[handleAddItem] Adding new item to state:", newItem);
         const newItemWithName = { ...newItem, reservedByName: newItem.reservedBy === currentUserId ? currentUserName : null };
         setWishlist(prev => prev ? { ...prev, items: [newItemWithName, ...prev.items] } : null);
    };

    const handleDeleteItem = async (itemId: string, itemTitle: string) => { 
        console.log(`[DeleteItem ${itemId}] Handler called.`); 
        
        // Используем TWA Confirm
        WebApp.showConfirm(`Delete "${itemTitle}"?`, async (confirmed) => {
            console.log(`[DeleteItem ${itemId}] TWA confirm result: ${confirmed}`);
            if (!confirmed) {
                console.log(`[DeleteItem ${itemId}] Confirmation cancelled.`); 
                return;
            }

            const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null; 
            setError(null);
            console.log(`[DeleteItem ${itemId}] Updating state optimistically...`); 
            setWishlist(prev => prev ? { ...prev, items: prev.items.filter(item => item.id !== itemId) } : null);
            
            try {
                console.log(`[DeleteItem ${itemId}] Sending DELETE request...`); 
                await axios.delete(`${API_BASE_URL}/api/wishlist-items/${itemId}`);
                console.log(`[DeleteItem ${itemId}] DELETE request successful.`); 
            } catch (err) {
                console.error(`[DeleteItem ${itemId}] Error deleting item:`, err); 
                setWishlist(originalWishlist); 
                setError(`Failed to delete "${itemTitle}".`);
                WebApp.showAlert(`Error deleting ${itemTitle}. Please try again.`); // Уведомление TWA
            }
            console.log(`[DeleteItem ${itemId}] Handler finished.`); 
        });
     };

    const handleReserve = async (itemId: string) => { 
        console.log(`[ReserveItem ${itemId}] Handler called.`);
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
            WebApp.showAlert(`Error reserving ${item.title}. Please try again.`);
        }
        console.log(`[ReserveItem ${itemId}] Handler finished.`);
     };

    const handleUnreserve = async (itemId: string) => { 
        console.log(`[UnreserveItem ${itemId}] Handler called.`);
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item) return;
         if (item.reservedBy !== currentUserId) {
             WebApp.showAlert("You can only unreserve items reserved by you."); // Уведомление TWA
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
            WebApp.showAlert(`Error unreserving ${item.title}. Please try again.`);
        }
         console.log(`[UnreserveItem ${itemId}] Handler finished.`);
     };

    const handleMarkAsBought = async (itemId: string) => { 
        console.log(`[MarkBought ${itemId}] Handler called.`); 
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item || item.isBought) {
             console.log(`[MarkBought ${itemId}] Already bought or item not found.`); 
             return;
        }
        
        // Используем TWA Confirm
        WebApp.showConfirm(`Mark "${item.title}" as bought? This is usually permanent.`, async (confirmed) => {
            console.log(`[MarkBought ${itemId}] TWA confirm result: ${confirmed}`);
             if (!confirmed) {
                 console.log(`[MarkBought ${itemId}] Confirmation cancelled.`); 
                 return;
             }

             const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null; 
             setError(null);
              const finalReservedById = item.isReserved ? (item.reservedBy ?? currentUserId) : currentUserId;
              const finalReservedByName = item.isReserved ? (item.reservedByName ?? currentUserName) : currentUserName;
             
             console.log(`[MarkBought ${itemId}] Updating state optimistically...`); 
             updateItemInState({ ...item, isBought: true, isReserved: true, reservedBy: finalReservedById, reservedByName: finalReservedByName }); 
             
             try {
                 console.log(`[MarkBought ${itemId}] Sending PATCH request...`); 
                 const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, {
                      isBought: true,
                      isReserved: true, 
                      reservedBy: finalReservedById 
                 });
                  console.log(`[MarkBought ${itemId}] PATCH request successful...`); 
                  const serverData = response.data;
                  const finalName = serverData.reservedBy === currentUserId ? currentUserName : null; 
                  updateItemInState({ ...serverData, reservedByName: finalName }); 
                  console.log(`[MarkBought ${itemId}] State updated...`); 
             } catch (err) {
                 console.error(`[MarkBought ${itemId}] Error marking item as bought:`, err); 
                 setWishlist(originalWishlist); 
                 setError(`Failed to mark "${item.title}" as bought.`);
                 WebApp.showAlert(`Error marking ${item.title} as bought. Please try again.`);
             }
             console.log(`[MarkBought ${itemId}] Handler finished.`); 
        });
    };
    // --- /Обработчики ---


    // --- Отображение ---
    console.log(`[Render WishlistDisplay] isCurrentUserBirthdayPerson: ${isCurrentUserBirthdayPerson}, currentUserId: ${currentUserId}, birthdayPersonUserId: ${birthdayPersonUserId}`); 

    if (loading) { 
        return <div className="p-4 text-center" style={{ color: 'var(--hint-color, #999999)' }}>Loading wishlist...</div>;
     }
    if (error && !wishlist) { 
        // Показываем ошибку загрузки, если вишлиста нет
        return <div className="p-4 text-center text-red-500">{error}</div>; 
    }
    if (!wishlist) { 
         // Если не загрузка и не ошибка, но вишлиста нет (например, 404 от бэка, но запрос прошел)
         return <div className="p-4 text-center" style={{ color: 'var(--hint-color, #999999)' }}>Wishlist not found or could not be created.</div>;
    }

    // Основной рендер, если вишлист есть
    return (
        <> 
            <h2 className="text-xl font-semibold mb-4 px-4 pt-4 font-heading"> {/* Добавлен font-heading */}
                Wishlist for Chat: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{wishlist.chatId}</span>
                {isCurrentUserBirthdayPerson && <span className="ml-2 text-sm font-normal text-yellow-500">(This is your list!)</span>}
            </h2>

            {/* Отображаем форму добавления, если пользователь НЕ именинник */}
            {!isCurrentUserBirthdayPerson && (
                 <AddItemForm wishlistId={wishlist.id} onItemAdded={handleAddItem} />
            )}

             {/* Отображаем ошибку действия (если она есть), но не ошибку загрузки */}
             {error && wishlist && error !== 'Failed to load wishlist.' && ( 
                 <div className="mt-4 mx-4 p-2 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-700">
                     {error}
                 </div>
             )}


            <div className="mt-6 px-4 pb-4">
                <h3 className="text-lg font-medium mb-3 font-heading">Items:</h3> {/* Добавлен font-heading */}
                {wishlist.items.length === 0 ? ( 
                     <p className="text-sm" style={{ color: 'var(--hint-color, #999999)' }}>This wishlist is empty...</p>
                 ) : (
                    <ul className="space-y-3">
                        {wishlist.items.map((item) => {
                             const isReservedByCurrentUser = item.isReserved && item.reservedBy === currentUserId;
                             const canInteractWithReserve = !isCurrentUserBirthdayPerson && !item.isBought && (!item.isReserved || isReservedByCurrentUser);
                             const canMarkAsBought = !isCurrentUserBirthdayPerson && !item.isBought;
                             const canDelete = !isCurrentUserBirthdayPerson && !item.isBought && (!item.isReserved || isReservedByCurrentUser);

                            return (
                                <li key={item.id} className={`p-3 border rounded-md shadow-sm transition duration-150 ease-in-out hover:shadow-md ${item.isBought ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : item.isReserved ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                     {/* Блок отображения данных элемента */}
                                     <div className="flex justify-between items-start">
                                          <div>
                                              {/* Добавлен font-heading */}
                                              <h4 className="font-medium text-lg font-heading">{item.title}</h4> 
                                              {item.description && <p className="text-sm mt-1" style={{ color: 'var(--second-text-color, #666)' }}>{item.description}</p>}
                                              {item.link && (
                                                  <a 
                                                    href={item.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    onClick={(e) => { e.preventDefault(); WebApp.openLink(item.link || '#'); }} // Используем WebApp.openLink
                                                    className="text-sm mt-1 block truncate max-w-xs md:max-w-md cursor-pointer" 
                                                    style={{ color: 'var(--link-color, #2481cc)' }}
                                                   >
                                                      {item.link}
                                                  </a>
                                              )}
                                          </div>
                                           {item.imageUrl && (
                                              <img src={item.imageUrl} alt={item.title} className="ml-4 w-16 h-16 object-cover rounded flex-shrink-0 border dark:border-gray-600" />
                                          )}
                                      </div>
                                     {/* Статус и Кнопки */}
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs" style={{ color: 'var(--hint-color, #999999)' }}>
                                         {/* Отображение статуса */}
                                         <span className={`font-medium ${item.isBought ? 'text-green-700 dark:text-green-400' : item.isReserved ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                                            Status: {item.isBought ? '🎁 Bought' : 
                                                     item.isReserved ? `🔒 Reserved ${isCurrentUserBirthdayPerson ? '' : (isReservedByCurrentUser ? `(by ${item.reservedByName || 'You'})` : '(by someone)')}` : 
                                                     '🟢 Available'}
                                        </span>
                                         {/* Блок кнопок (показываем только если не именинник) */}
                                         {!isCurrentUserBirthdayPerson && (
                                             <div className="mt-2 sm:mt-0 space-x-2 flex-shrink-0">
                                                 {/* Кнопка Reserve */}
                                                 {canInteractWithReserve && !item.isReserved && (
                                                     <button onClick={() => handleReserve(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:ring-yellow-500" title="Reserve"> Reserve </button>
                                                 )}
                                                 {/* Кнопка Unreserve */}
                                                 {canInteractWithReserve && isReservedByCurrentUser && (
                                                     <button onClick={() => handleUnreserve(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500" title="Unreserve"> Unreserve </button>
                                                 )}
                                                 {/* Кнопка Mark as Bought */}
                                                 {canMarkAsBought && (
                                                     <button onClick={() => handleMarkAsBought(item.id)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 focus:ring-green-500" title="Mark Bought"> Mark Bought </button>
                                                 )}
                                                 {/* Кнопка Delete */}
                                                 {canDelete && ( 
                                                     <button onClick={() => handleDeleteItem(item.id, item.title)} className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 focus:ring-red-500" title="Delete"> Delete </button>
                                                 )}
                                             </div>
                                         )}
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