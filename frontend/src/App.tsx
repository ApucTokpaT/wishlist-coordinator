// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk'; // Импортируем SDK
import WishlistDisplay from './components/WishlistDisplay';

function App() {
  // State для хранения данных, полученных из Telegram
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [isLoadingTWA, setIsLoadingTWA] = useState(true); // Флаг загрузки TWA данных
  const [twaError, setTwaError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // --- Получаем данные из Telegram WebApp ---
      // initDataUnsafe содержит данные о пользователе, чате и т.д.
      // ВАЖНО: initDataUnsafe небезопасен для авторизации без проверки на бэкенде!
      // Но для получения ID пользователя и чата на клиенте - подходит.
      const initData = WebApp.initDataUnsafe;
      const user = initData?.user;
      // chatId доступен, если Web App открыт из контекста чата
      // В TWA нет прямого стабильного поля chatId, часто используют ID группы/канала
      // или ID пользователя для личных чатов. Для простоты, если есть startParam,
      // будем считать его chatId. Либо можно использовать ID юзера для личного вишлиста.
      // !!! Эту логику нужно будет адаптировать под ваш сценарий запуска TWA !!!
      let chatIdFromTWA: string | null = null;
      if (initData?.start_param) {
          // Если TWA запущен с параметром (например, через deeplink), используем его
          chatIdFromTWA = initData.start_param; 
          console.log("TWA started with start_param:", chatIdFromTWA);
      } else if (initData?.chat?.id) {
          // Попробуем взять ID чата, если доступно (не всегда)
          chatIdFromTWA = String(initData.chat.id);
           console.log("TWA context chat ID:", chatIdFromTWA);
      } else if (user?.id) {
          // В крайнем случае, используем ID пользователя как идентификатор "личного" вишлиста
           chatIdFromTWA = `user_${user.id}`;
           console.log("TWA using user ID as fallback chat ID:", chatIdFromTWA);
      } else {
           // Если не удалось получить ID чата, показываем ошибку
           console.error("TWA Error: Could not determine chat context ID.");
           setTwaError("Could not determine the chat context. Please open the app from a chat.");
      }


      if (user?.id) {
        setTelegramUserId(user.id);
        console.log("TWA User:", user);
      } else {
         console.error("TWA Error: User data not available.");
        // Если нет юзера, возможно, приложение открыто не в Telegram
         setTwaError("Could not get user data. Are you running inside Telegram?");
      }

      setTelegramChatId(chatIdFromTWA);

      // --- Адаптация UI под тему Telegram ---
      WebApp.ready(); // Сообщаем Telegram, что приложение готово
      // Устанавливаем цвет шапки под цвет Telegram
       if (WebApp.headerColor && WebApp.themeParams.header_bg_color) {
           // Можно было бы использовать WebApp.setHeaderColor(WebApp.themeParams.header_bg_color),
           // но она меняет цвет нативной шапки, а у нас своя.
           // Лучше использовать CSS переменные.
           document.documentElement.style.setProperty('--header-color', WebApp.themeParams.header_bg_color);
           document.documentElement.style.setProperty('--button-color', WebApp.themeParams.button_color || '#2481cc'); // Цвет кнопок
           document.documentElement.style.setProperty('--text-color', WebApp.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--bg-color', WebApp.themeParams.bg_color || '#ffffff');

             // Применяем класс темы к body для Tailwind dark mode (если есть)
             if (WebApp.colorScheme === 'dark') {
                 document.body.classList.add('dark');
             } else {
                 document.body.classList.remove('dark');
             }

       } else {
             console.warn("TWA: Header color or theme params not available for styling.");
              // Устанавливаем цвета по умолчанию, если тема не пришла
             document.documentElement.style.setProperty('--header-color', '#212121'); // Default dark
              document.documentElement.style.setProperty('--button-color', '#5EAAFF'); // Default blue
              document.documentElement.style.setProperty('--text-color', '#ffffff'); // Default white
              document.documentElement.style.setProperty('--bg-color', '#17212b'); // Default dark bg

       }
        // Показываем основную кнопку (если нужна)
        // WebApp.MainButton.setText("View Items");
        // WebApp.MainButton.show();

    } catch (error) {
       console.error("Error initializing TWA:", error);
       setTwaError("Failed to initialize Telegram Web App features.");
    } finally {
       setIsLoadingTWA(false); // Завершаем загрузку TWA данных
    }

  }, []); // Пустой массив зависимостей, чтобы выполнилось один раз при монтировании

  // --- Отображение состояний загрузки/ошибки TWA ---
  if (isLoadingTWA) {
    return <div className="p-4 text-center">Initializing Telegram Web App...</div>;
  }

  if (twaError) {
    return <div className="p-4 text-center text-red-500">{twaError}</div>;
  }

  if (!telegramChatId || !telegramUserId) {
     // Если ID чата или пользователя не получены (хотя ошибки не было), это странно
     return <div className="p-4 text-center text-orange-500">Required context data (user/chat) is missing.</div>;
  }

  // --- Рендеринг основного приложения ---
  return (
    // Используем CSS переменные для цветов
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '100vh' }}>
      <header 
         className="p-4 shadow-md text-white" // Убрали bg-gray-800
         style={{ backgroundColor: 'var(--header-color)' }} // Используем цвет из TWA
      >
        <h1 className="text-xl font-bold text-center">Wishlist Координатор TWA</h1>
      </header>
      <main className="container mx-auto p-0 md:p-4"> {/* Убрали внешние отступы на мобильных */}
        {/* Передаем реальные ID в компонент */}
        <WishlistDisplay 
           chatId={telegramChatId} 
           currentUserId={String(telegramUserId)} // Конвертируем ID пользователя в строку
         />
      </main>
    </div>
  );
}

export default App;