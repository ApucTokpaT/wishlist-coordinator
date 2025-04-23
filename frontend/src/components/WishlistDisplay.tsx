// frontend/src/components/WishlistDisplay.tsx
import { useState, useEffect } from 'react'; 
import axios from 'axios';
import AddItemForm from './AddItemForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

// --- Типы данных ---
export interface WishlistItem { // ... (интерфейс без изменений) ...
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
interface Wishlist { // ... (интерфейс без изменений) ...
    id: string;
    chatId: string;
    createdAt: string;
    updatedAt: string;
    items: WishlistItem[];
}
// --- /Типы данных ---

// --- Пропсы компонента ---
interface WishlistDisplayProps { // ... (интерфейс без изменений) ...
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
     useEffect(() => { // ... (код без изменений) ...
        if (!chatId) return;
        const fetchWishlist = async () => { 
             setLoading(true);
             setError(null);
             try {
                 const response = await axios.post<Wishlist>(`${API_BASE_URL}/api/wishlists`, { chatId: chatId });
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
     }, [chatId, currentUserName, currentUserId]); 

    // --- Обработчики ---
    const updateItemInState = (updatedItem: WishlistItem) => { // ... (код без изменений) ...
         if (updatedItem.isReserved && updatedItem.reservedBy === currentUserId && !updatedItem.reservedByName) {
             updatedItem.reservedByName = currentUserName;
         } else if (!updatedItem.isReserved) {
             updatedItem.reservedByName = null;
         }
        setWishlist(prev => prev ? { ...prev, items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item) } : null);
    };

    const handleAddItem = (newItem: WishlistItem) => { // ... (код без изменений) ...
         const newItemWithName = { ...newItem, reservedByName: newItem.reservedBy === currentUserId ? currentUserName : null };
         setWishlist(prev => prev ? { ...prev, items: [newItemWithName, ...prev.items] } : null);
    };

    // --- ИЗМЕНЕНИЕ: Добавлены логи для window.confirm ---
    const handleDeleteItem = async (itemId: string, itemTitle: string) => { 
        console.log(`[DeleteItem ${itemId}] Handler called.`); 
        console.log(`[DeleteItem ${itemId}] Showing confirmation...`);
        const confirmed = window.confirm(`Delete "${itemTitle}"?`);
        console.log(`[DeleteItem ${itemId}] window.confirm result: ${confirmed}`); // <--- ВАЖНЫЙ ЛОГ
        if (!confirmed) { 
            console.log(`[DeleteItem ${itemId}] Confirmation cancelled based on result.`); 
            return;
        }
        // ... остальной код удаления без изменений ...
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
        }
        console.log(`[DeleteItem ${itemId}] Handler finished.`); 
     };

    const handleReserve = async (itemId: string) => { /* ... код без изменений (уже были логи) ... */ };
    const handleUnreserve = async (itemId: string) => { /* ... код без изменений (уже были логи) ... */ };

    // --- ИЗМЕНЕНИЕ: Добавлены логи для window.confirm ---
    const handleMarkAsBought = async (itemId: string) => { 
        console.log(`[MarkBought ${itemId}] Handler called.`); 
        const item = wishlist?.items.find(i => i.id === itemId);
        if (!item || item.isBought) { /* ... */ return; }
        console.log(`[MarkBought ${itemId}] Showing confirmation...`);
        const confirmed = window.confirm(`Mark "${item.title}" as bought?`);
        console.log(`[MarkBought ${itemId}] window.confirm result: ${confirmed}`); // <--- ВАЖНЫЙ ЛОГ
        if (!confirmed) { 
             console.log(`[MarkBought ${itemId}] Confirmation cancelled based on result.`); 
             return;
        }
        // ... остальной код отметки о покупке без изменений ...
        const originalWishlist = wishlist ? JSON.parse(JSON.stringify(wishlist)) : null; 
        setError(null);
         const finalReservedById = item.isReserved ? (item.reservedBy ?? currentUserId) : currentUserId;
         const finalReservedByName = item.isReserved ? (item.reservedByName ?? currentUserName) : currentUserName;
        console.log(`[MarkBought ${itemId}] Updating state optimistically...`); 
        updateItemInState({ ...item, isBought: true, isReserved: true, reservedBy: finalReservedById, reservedByName: finalReservedByName }); 
        try {
            console.log(`[MarkBought ${itemId}] Sending PATCH request...`); 
            const response = await axios.patch<WishlistItem>(`${API_BASE_URL}/api/wishlist-items/${itemId}`, { /*...*/ });
             console.log(`[MarkBought ${itemId}] PATCH request successful...`); 
             const serverData = response.data;
             const finalName = serverData.reservedBy === currentUserId ? currentUserName : null; 
             updateItemInState({ ...serverData, reservedByName: finalName }); 
             console.log(`[MarkBought ${itemId}] State updated...`); 
        } catch (err) {
            console.error(`[MarkBought ${itemId}] Error marking item as bought:`, err); 
            setWishlist(originalWishlist); 
            setError(`Failed to mark "${item.title}" as bought.`);
        }
        console.log(`[MarkBought ${itemId}] Handler finished.`); 
    };
    // --- /Обработчики ---


    // --- Отображение ---
    // ... (Остальной JSX код без изменений) ...
    console.log(`[Render WishlistDisplay] isCurrentUserBirthdayPerson: ${isCurrentUserBirthdayPerson}, currentUserId: ${currentUserId}, birthdayPersonUserId: ${birthdayPersonUserId}`); 
    if (loading) { /* ... */ }
    if (error && !wishlist) { /* ... */ }
    if (!wishlist) { /* ... */ }
    return ( <> {/* ... весь JSX без изменений ... */} </> );
    // --- /Отображение ---
};

export default WishlistDisplay;