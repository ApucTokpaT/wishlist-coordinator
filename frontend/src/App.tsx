// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import WishlistDisplay from './components/WishlistDisplay';

// !!! Симулируем ID пользователя, для которого этот вишлист !!!
// Позже это может быть установлено динамически или передано в start_param
const SIMULATED_BIRTHDAY_PERSON_USER_ID = 'user-other-456'; 
// (Можете временно поставить сюда свой реальный ID из логов для теста)
// ------------------------------------------------------------------


function App() {
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null); // Храним как строку
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [telegramUserName, setTelegramUserName] = useState<string>('Guest'); // Имя пользователя
  const [isLoadingTWA, setIsLoadingTWA] = useState(true);
  const [twaError, setTwaError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const initData = WebApp.initDataUnsafe;
      const user = initData?.user;

      // --- Определение Chat ID (логика та же) ---
       let chatIdFromTWA: string | null = null;
       if (initData?.start_param) {
           chatIdFromTWA = initData.start_param;
       } else if (initData?.chat?.id) {
           chatIdFromTWA = String(initData.chat.id);
       } else if (user?.id) {
           chatIdFromTWA = `user_${user.id}`;
       } else {
           console.error("TWA Error: Could not determine chat context ID.");
           setTwaError("Could not determine the chat context.");
       }
       setTelegramChatId(chatIdFromTWA);
      // -----------------------------------------

      if (user?.id) {
        setTelegramUserId(String(user.id)); // Сохраняем как строку
        // Используем first_name, если есть, иначе username или 'User <ID>'
        setTelegramUserName(user.first_name || user.username || `User ${user.id}`); 
        console.log("TWA User:", user);
      } else {
        console.error("TWA Error: User data not available.");
        setTwaError("Could not get user data.");
      }

      // --- Адаптация UI (логика та же) ---
       WebApp.ready(); 
       if (WebApp.headerColor && WebApp.themeParams.header_bg_color) {
           document.documentElement.style.setProperty('--header-color', WebApp.themeParams.header_bg_color);
           document.documentElement.style.setProperty('--button-color', WebApp.themeParams.button_color || '#2481cc'); 
           document.documentElement.style.setProperty('--text-color', WebApp.themeParams.text_color || '#000000');
           document.documentElement.style.setProperty('--bg-color', WebApp.themeParams.bg_color || '#ffffff');
           document.documentElement.style.setProperty('--hint-color', WebApp.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--link-color', WebApp.themeParams.link_color || '#2481cc');
             document.documentElement.style.setProperty('--second-text-color', WebApp.themeParams.secondary_bg_color || '#f0f0f0'); // Приблизительно

             if (WebApp.colorScheme === 'dark') {
                 document.body.classList.add('dark');
             } else {
                 document.body.classList.remove('dark');
             }
       } else {
            console.warn("TWA: Theme params not available for styling.");
             // Устанавливаем цвета по умолчанию (можно улучшить)
             document.documentElement.style.setProperty('--header-color', '#212121'); 
             document.documentElement.style.setProperty('--button-color', '#5EAAFF'); 
             document.documentElement.style.setProperty('--text-color', '#ffffff'); 
             document.documentElement.style.setProperty('--bg-color', '#17212b'); 
             document.documentElement.style.setProperty('--hint-color', '#708499');
             document.documentElement.style.setProperty('--link-color', '#62b1f3');
             document.documentElement.style.setProperty('--second-text-color', '#aaaaaa');
       }
      // -----------------------------------------

    } catch (error) {
       console.error("Error initializing TWA:", error);
       setTwaError("Failed to initialize TWA features.");
    } finally {
       setIsLoadingTWA(false);
    }
  }, []);

  if (isLoadingTWA) {
    return <div className="p-4 text-center">Initializing...</div>;
  }
  if (twaError) {
    return <div className="p-4 text-center text-red-500">{twaError}</div>;
  }
  if (!telegramChatId || !telegramUserId) {
     return <div className="p-4 text-center text-orange-500">Required context data missing.</div>;
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '100vh' }}>
      <header 
         className="p-4 shadow-md text-white" 
         style={{ backgroundColor: 'var(--header-color)' }}
      >
         <h1 className="text-xl font-bold text-center">Wishlist Координатор TWA</h1>
         {/* Можно вывести имя пользователя для отладки */}
         {/* <p className="text-xs text-center opacity-70">User: {telegramUserName} ({telegramUserId})</p> */}
      </header>
      <main className="container mx-auto p-0 md:p-4">
        <WishlistDisplay 
           chatId={telegramChatId} 
           currentUserId={telegramUserId} 
           currentUserName={telegramUserName} // Передаем имя
           // !!! Передаем ID именинника !!!
           birthdayPersonUserId={SIMULATED_BIRTHDAY_PERSON_USER_ID} 
         />
      </main>
    </div>
  );
}

export default App;