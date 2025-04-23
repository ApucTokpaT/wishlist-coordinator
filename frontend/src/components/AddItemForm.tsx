// frontend/src/components/AddItemForm.tsx
import React, { useState } from 'react';
import axios from 'axios'; // Импортируем Axios

// Импортируем тип из WishlistDisplay
// Убедитесь, что WishlistItem экспортирован из WishlistDisplay или вынесен в отдельный файл
import { WishlistItem } from './WishlistDisplay';

// Определяем типы для пропсов, которые будет получать компонент
interface AddItemFormProps {
  wishlistId: string;
  onItemAdded: (newItem: WishlistItem) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ wishlistId, onItemAdded }) => {
  // State для хранения значений полей формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обработчик отправки формы
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // --- НАЧАЛО: РЕАЛЬНЫЙ AXIOS ЗАПРОС ---
      const response = await axios.post<WishlistItem>(
        `/api/wishlists/${wishlistId}/items`, // URL эндпоинта бэкенда
        { // Тело запроса с данными из формы
            title: title.trim(),
            // Отправляем null или значение, если поле было заполнено и не пустое
            description: description.trim() ? description.trim() : null,
            link: link.trim() ? link.trim() : null,
            imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        }
      );
      // --- КОНЕЦ: РЕАЛЬНЫЙ AXIOS ЗАПРОС ---

      // Вызываем колбэк с РЕАЛЬНЫМ новым элементом, полученным от бэкенда
      onItemAdded(response.data);

      // Очищаем форму после успешной отправки
      setTitle('');
      setDescription('');
      setLink('');
      setImageUrl('');

    } catch (err) {
        console.error('Error adding item:', err);
        let errorMessage = 'Failed to add item. Please try again.';
        if (axios.isAxiosError(err)) {
            // Если бэкенд возвращает сообщение об ошибке в { message: "..." }
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 404) {
                errorMessage = 'Wishlist not found. Cannot add item.';
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid data provided. Please check the form.';
            }
            // Можно добавить обработку других кодов ошибок (500 и т.д.)
        }
        setError(errorMessage);
        // Не очищаем форму при ошибке, чтобы пользователь мог исправить
    } finally {
      setIsSubmitting(false); // Завершаем отправку в любом случае
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-md bg-gray-50 shadow-sm">
      <h3 className="text-lg font-medium mb-3">Add a New Wish</h3>
      <form onSubmit={handleSubmit}>
        {/* Поле Title */}
        <div className="mb-3">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Поле Description */}
        <div className="mb-3">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Поле Link */}
        <div className="mb-3">
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
            Link (optional)
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Поле Image URL */}
        <div className="mb-4">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Отображение ошибки */}
        {error && (
          <div className="mb-3 p-2 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {/* Кнопка Submit */}
        <button
          type="submit"
          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;