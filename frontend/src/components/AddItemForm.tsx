// frontend/src/components/AddItemForm.tsx
import { useState } from 'react'; // Убрали React
import axios from 'axios';
import { WishlistItem } from './WishlistDisplay'; 
import { Button } from "@/components/ui/button"; // <--- ИМПОРТ КНОПКИ SHADCN
import { Input } from "@/components/ui/input";   // <--- ИМПОРТ ПОЛЯ ВВОДА SHADCN (Добавим для примера)
import { Textarea } from "@/components/ui/textarea"; // <--- ИМПОРТ ТЕКСТОВОЙ ОБЛАСТИ SHADCN (Добавим для примера)
import { Label } from "@/components/ui/label";     // <--- ИМПОРТ ЛЕЙБЛА SHADCN (Добавим для примера)


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
      const response = await axios.post<WishlistItem>(
        `${API_BASE_URL}/api/wishlists/${wishlistId}/items`, 
        {
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            link: link.trim() ? link.trim() : null,
            imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        }
      );
      
      onItemAdded(response.data); 

      // Очищаем форму
      setTitle('');
      setDescription('');
      setLink('');
      setImageUrl('');

    } catch (err) {
        console.error('Error adding item:', err);
        let errorMessage = 'Failed to add item. Please try again.';
        if (axios.isAxiosError(err)) {
            if (err.response?.data?.message) errorMessage = err.response.data.message;
            else if (err.response?.status === 404) errorMessage = 'Wishlist not found.';
            else if (err.response?.status === 400) errorMessage = 'Invalid data provided.';
        }
        setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Используем немного другие стили для контейнера, чтобы соответствовать Shadcn
    <div className="mt-6 p-4 border rounded-md bg-card shadow-sm dark:bg-card"> 
      <h3 className="text-lg font-semibold mb-4 leading-none tracking-tight">Add a New Wish</h3> 
      {/* Используем семантичные классы Shadcn для заголовка */}
      <form onSubmit={handleSubmit} className="space-y-4"> 
         {/* Добавляем отступы между элементами формы */}

        {/* Поле Title с компонентами Shadcn */}
        <div className="grid w-full items-center gap-1.5"> 
          {/* Используем grid для Label + Input */}
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label> 
          {/* Используем цвет destructive для звездочки */}
          <Input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Enter wish title..."
          />
        </div>

        {/* Поле Description с компонентами Shadcn */}
        <div className="grid w-full gap-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            placeholder="Add more details..."
          />
        </div>

        {/* Поле Link с компонентами Shadcn */}
         <div className="grid w-full items-center gap-1.5">
           <Label htmlFor="link">Link (optional)</Label>
           <Input
             type="url"
             id="link"
             value={link}
             onChange={(e) => setLink(e.target.value)}
             placeholder="https://example.com/product"
             disabled={isSubmitting}
           />
         </div>

        {/* Поле Image URL с компонентами Shadcn */}
        <div className="grid w-full items-center gap-1.5">
           <Label htmlFor="imageUrl">Image URL (optional)</Label>
           <Input
             type="url"
             id="imageUrl"
             value={imageUrl}
             onChange={(e) => setImageUrl(e.target.value)}
             placeholder="https://example.com/image.jpg"
             disabled={isSubmitting}
           />
         </div>


        {/* Отображение ошибки */}
        {error && (
          // Используем стандартные цвета Tailwind для ошибки
          <div className="p-2 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-700">
            {error}
          </div>
        )}

        {/* Кнопка Submit (Shadcn UI) */}
         <Button 
           type="submit" 
           className="w-full" // Ширина на весь контейнер
           disabled={isSubmitting}
         >
           {isSubmitting ? 'Adding...' : 'Add Item'}
         </Button>
      </form>
    </div>
  );
};

export default AddItemForm;