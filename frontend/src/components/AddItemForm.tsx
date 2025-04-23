// frontend/src/components/AddItemForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { WishlistItem } from './WishlistDisplay'; // Импортируем тип

// Определяем базовый URL API из переменных окружения
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Определяем типы для пропсов
interface AddItemFormProps {
  wishlistId: string;
  onItemAdded: (newItem: WishlistItem) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ wishlistId, onItemAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Используем переменную окружения для URL
      const response = await axios.post<WishlistItem>(
        `${API_BASE_URL}/api/wishlists/${wishlistId}/items`, 
        {
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            link: link.trim() ? link.trim() : null,
            imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        }
      );
      
      onItemAdded(response.data); // Вызываем колбэк с реальным элементом

      // Очищаем форму
      setTitle('');
      setDescription('');
      setLink('');
      setImageUrl('');

    } catch (err) {
        console.error('Error adding item:', err);
        let errorMessage = 'Failed to add item. Please try again.';
        if (axios.isAxiosError(err)) {
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 404) {
                errorMessage = 'Wishlist not found. Cannot add item.';
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid data provided. Please check the form.';
            }
        }
        setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ... (Остальной JSX код формы без изменений, как в предыдущем полном файле) ...
    <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-3">Add a New Wish</h3>
          <form onSubmit={handleSubmit}>
            {/* Поле Title */}
            <div className="mb-3">
              <label htmlFor="title" className="block text-sm font-medium mb-1" style={{ color: 'var(--second-text-color, #666)'}}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Поле Description */}
            <div className="mb-3">
              <label htmlFor="description" className="block text-sm font-medium mb-1" style={{ color: 'var(--second-text-color, #666)'}}>
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Поле Link */}
            <div className="mb-3">
              <label htmlFor="link" className="block text-sm font-medium mb-1" style={{ color: 'var(--second-text-color, #666)'}}>
                Link (optional)
              </label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Поле Image URL */}
            <div className="mb-4">
              <label htmlFor="imageUrl" className="block text-sm font-medium mb-1" style={{ color: 'var(--second-text-color, #666)'}}>
                Image URL (optional)
              </label>
              <input
                type="url"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
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
               className={`w-full px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
               style={{ backgroundColor: 'var(--button-color, #2481cc)'}} // Используем цвет кнопки из TWA
               disabled={isSubmitting}
             >
               {isSubmitting ? 'Adding...' : 'Add Item'}
             </button>
          </form>
        </div>
  );
};

export default AddItemForm;