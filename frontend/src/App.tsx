// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import WishlistDisplay from './components/WishlistDisplay';

const SIMULATED_BIRTHDAY_PERSON_USER_ID = 'user-other-456'; 

function App() {
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [telegramUserName, setTelegramUserName] = useState<string>('Guest'); 
  const [isLoadingTWA, setIsLoadingTWA] = useState(true);
  const [twaError, setTwaError] = useState<string | null>(null);

  useEffect(() => { // ... (Логика инициализации TWA без изменений) ...
     try {
        const initData = WebApp.initDataUnsafe;
        const user = initData?.user;
        let chatIdFromTWA: string | null = null;
        if (initData?.start_param) chatIdFromTWA = initData.start_param;
        else if (initData?.chat?.id) chatIdFromTWA = String(initData.chat.id);
        else if (user?.id) chatIdFromTWA = `user_${user.id}`;
        else { console.error("TWA Error: Could not determine chat context ID."); setTwaError("Could not determine the chat context."); }
        setTelegramChatId(chatIdFromTWA);
        if (user?.id) {
          setTelegramUserId(String(user.id)); 
          setTelegramUserName(user.first_name || user.username || `User ${user.id}`); 
          console.log("TWA User:", user);
        } else { console.error("TWA Error: User data not available."); setTwaError("Could not get user data."); }
         WebApp.ready(); 
         if (WebApp.headerColor && WebApp.themeParams.header_bg_color) { /* ... Установка CSS переменных ... */ } 
         else { console.warn("TWA: Theme params not available."); /* ... Установка дефолтных переменных ... */ }
     } catch (error) { console.error("Error initializing TWA:", error); setTwaError("Failed to initialize TWA features."); } 
     finally { setIsLoadingTWA(false); }
  }, []);

  // --- Отображение загрузки/ошибки TWA (без изменений) ---
  if (isLoadingTWA) { return <div className="p-4 text-center">Initializing...</div>; }
  if (twaError) { return <div className="p-4 text-center text-red-500">{twaError}</div>; }
  if (!telegramChatId || !telegramUserId) { return <div className="p-4 text-center text-orange-500">Required context data missing.</div>; }

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '100vh' }}>
      <header 
         className="p-4 shadow-md text-white" 
         style={{ backgroundColor: 'var(--header-color)' }}
      >
         {/* --- ДОБАВЛЕН КЛАСС ШРИФТА --- */}
         <h1 className="text-xl font-bold text-center font-heading">
             Wishlist Координатор TWA
         </h1>
         {/* -------------------------- */}
      </header>
      <main className="container mx-auto p-0 md:p-4">
        <WishlistDisplay 
           chatId={telegramChatId} 
           currentUserId={telegramUserId} 
           currentUserName={telegramUserName}
           birthdayPersonUserId={SIMULATED_BIRTHDAY_PERSON_USER_ID} 
         />
      </main>
    </div>
  );
}

export default App;