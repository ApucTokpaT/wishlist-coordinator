// frontend/src/App.tsx
import WishlistDisplay from './components/WishlistDisplay'; // Импортируем наш компонент

function App() {
  return (
    <div> {/* Обертка */}
      <header className="bg-gray-800 text-white p-4 shadow-md">
         <h1 className="text-xl font-bold">Wishlist Координатор TWA</h1>
      </header>
      <main className="container mx-auto p-4"> {/* Основной контент */}
         <WishlistDisplay /> {/* Используем компонент */}
      </main>
    </div>
  );
}

export default App;