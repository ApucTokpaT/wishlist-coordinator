// frontend/src/App.tsx
// Не импортируем App.css

function App() {
  return (
    <div className="p-4"> {/* Пример класса Tailwind: отступ */}
      <h1 className="text-2xl font-bold text-blue-600"> {/* Классы Tailwind для текста */}
        Wishlist Координатор (Frontend)
      </h1>
      <p className="mt-2 text-gray-700"> {/* Классы Tailwind */}
        Скоро здесь будет наш интерфейс!
      </p>
      <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50">
         Тестовая Кнопка
      </button> {/* Еще примеры классов Tailwind */}
    </div>
  )
}

export default App