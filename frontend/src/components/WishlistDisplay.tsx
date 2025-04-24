// frontend/src/components/WishlistDisplay.tsx
import { useState, useEffect } from 'react'; 
import axios from 'axios';
import AddItemForm from './AddItemForm'; 
import WebApp from '@twa-dev/sdk'; 
import { Button } from "./ui/button"; // <--- ИСПРАВЛЕН ИМПОРТ
import { 
    Card, 
    CardContent, 
    CardFooter, 
} from "./ui/card";   // <--- ИСПРАВЛЕН ИМПОРТ

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
     }, [chatId, currentUserName, currentUserId]); 

    // --- Обработчики ---
    const updateItemInState = (updatedItem: WishlistItem) => { // ... (код без изменений) ... };
    const handleAddItem = (newItem: WishlistItem) => { // ... (код без изменений) ... };
    const handleDeleteItem = async (itemId: string, itemTitle: string) => { // ... (код без изменений) ... };
    const handleReserve = async (itemId: string) => { // ... (код без изменений) ... };
    const handleUnreserve = async (itemId: string) => { // ... (код без изменений) ... };
    const handleMarkAsBought = async (itemId: string) => { // ... (код без изменений) ... };
    // --- /Обработчики ---


    // --- Отображение ---
    console.log(`[Render WishlistDisplay] isCurrentUserBirthdayPerson: ${isCurrentUserBirthdayPerson}, currentUserId: ${currentUserId}, birthdayPersonUserId: ${birthdayPersonUserId}`); 

    if (loading) { // ... Отображение загрузки ... }
    if (error && !wishlist) { // ... Отображение ошибки загрузки ... }
    if (!wishlist) { // ... Отображение пустого состояния ... }

    return (
        <> 
            <h2 className="text-2xl font-heading mb-4 px-4 pt-4 text-center text-comic-black dark:text-comic-white uppercase tracking-wide"> 
                Wishlist! 
                {isCurrentUserBirthdayPerson && <span className="ml-2 text-base font-normal text-comic-yellow block">(Psst! This is your list!)</span>}
            </h2>

            {!isCurrentUserBirthdayPerson && (
                 <AddItemForm wishlistId={wishlist.id} onItemAdded={handleAddItem} />
            )}

             {error && wishlist && error !== 'Failed to load wishlist.' && ( 
                 <div className="mt-4 mx-4 p-2 text-sm border-2 border-comic-red bg-red-100 text-comic-red rounded-md font-sans font-bold">
                     💥 Oops! {error}
                 </div>
             )}

            <div className="mt-6 px-4 pb-4">
                 {wishlist.items.length > 0 && (
                     <h3 className="text-xl font-heading mb-3 text-comic-black dark:text-comic-white">Wishes:</h3>
                )}

                {wishlist.items.length === 0 ? ( 
                     <p className="text-lg text-center italic font-sans" style={{ color: 'var(--hint-color, #999999)' }}>This wishlist is empty... Add something!</p>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> 
                        {wishlist.items.map((item) => {
                             // ... (логика can... переменных) ...
                             const isReservedByCurrentUser = item.isReserved && item.reservedBy === currentUserId;
                             const canInteractWithReserve = !isCurrentUserBirthdayPerson && !item.isBought && (!item.isReserved || isReservedByCurrentUser);
                             const canMarkAsBought = !isCurrentUserBirthdayPerson && !item.isBought;
                             const canDelete = !isCurrentUserBirthdayPerson && !item.isBought && (!item.isReserved || isReservedByCurrentUser);

                            return (
                                <Card 
                                  key={item.id} 
                                  className={`border-2 border-comic-black shadow-comic transition-shadow hover:shadow-comic-sm rounded-lg overflow-hidden ${item.isBought ? 'bg-comic-green/30' : item.isReserved ? 'bg-comic-yellow/30' : 'bg-white'}`}
                                >
                                    <CardContent className="p-4"> 
                                         <div className="flex justify-between items-start mb-3 min-h-[6rem]"> 
                                          <div>
                                              <h4 className="font-heading text-2xl text-comic-black mb-1">{item.title}</h4> 
                                              {item.description && <p className="text-sm mt-1 font-sans text-comic-black/80">{item.description}</p>}
                                              {item.link && ( /* ... ссылка ... */ )}
                                          </div>
                                           {item.imageUrl && ( /* ... картинка ... */ )}
                                      </div>
                                    </CardContent>
                                    <CardFooter className="p-3 pt-3 border-t-2 border-comic-black/30 flex flex-col items-start gap-2"> 
                                         {/* Статус */}
                                         <span className={`font-bold text-sm uppercase ${ /* ... классы и текст статуса ... */ }`}>
                                            {/* ... текст статуса ... */}
                                        </span>
                                         {/* Кнопки */}
                                         {!isCurrentUserBirthdayPerson && (
                                             <div className="w-full flex flex-wrap gap-1 justify-start"> 
                                                 {/* --- ИСПОЛЬЗУЕМ SHADCN BUTTONS --- */}
                                                 {canInteractWithReserve && !item.isReserved && (
                                                     <Button variant="outline" size="sm" onClick={() => handleReserve(item.id)} className="flex-grow border-2 border-comic-black shadow-comic-sm hover:shadow-none active:shadow-none bg-comic-yellow text-comic-black hover:bg-opacity-80 font-heading text-xs" title="Reserve">RESERVE</Button>
                                                 )}
                                                 {canInteractWithReserve && isReservedByCurrentUser && (
                                                     <Button variant="outline" size="sm" onClick={() => handleUnreserve(item.id)} className="flex-grow border-2 border-comic-black shadow-comic-sm hover:shadow-none active:shadow-none bg-gray-300 text-comic-black hover:bg-opacity-80 font-heading text-xs" title="Unreserve">UNRESERVE</Button>
                                                 )}
                                                 {canMarkAsBought && (
                                                     <Button variant="outline" size="sm" onClick={() => handleMarkAsBought(item.id)} className="flex-grow border-2 border-comic-black shadow-comic-sm hover:shadow-none active:shadow-none bg-comic-green text-comic-white hover:bg-opacity-80 font-heading text-xs" title="Mark Bought">BOUGHT IT!</Button>
                                                 )}
                                                 {canDelete && ( 
                                                     <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id, item.title)} className="flex-grow border-2 border-comic-black shadow-comic-sm hover:shadow-none active:shadow-none bg-comic-red text-comic-white hover:bg-opacity-80 font-heading text-xs" title="Delete">DELETE</Button>
                                                 )}
                                                 {/* --------------------------- */}
                                             </div>
                                         )}
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div> 
                 )}
            </div>
        </>
    );
};

export default WishlistDisplay;