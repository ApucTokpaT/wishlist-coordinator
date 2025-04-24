// frontend/src/components/AddItemForm.tsx
import { useState } from 'react'; 
import axios from 'axios';
import { WishlistItem } from './WishlistDisplay'; 
import { Button } from "./ui/button";   // <--- ИСПРАВЛЕН ИМПОРТ
import { Input } from "./ui/input";    // <--- ИСПРАВЛЕН ИМПОРТ
import { Textarea } from "./ui/textarea"; // <--- ИСПРАВЛЕН ИМПОРТ
import { Label } from "./ui/label";     // <--- ИСПРАВЛЕН ИМПОРТ


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AddItemFormProps {
  wishlistId: string;
  onItemAdded: (newItem: WishlistItem) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ wishlistId, onItemAdded }) => {
    // ... state и handleSubmit без изменений ...
    const [title, setTitle] = useState(''); /* ... */ 
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => { /* ... */ };

  return (
    <div className="mt-6 mb-6 p-4 border-2 border-comic-black rounded-lg bg-white shadow-comic-sm"> 
      <h3 className="text-xl font-heading mb-4 text-center text-comic-black uppercase tracking-wider">Add a New Wish!</h3> 
      <form onSubmit={handleSubmit} className="space-y-4"> 
        {/* Поле Title */}
        <div className="grid w-full items-center gap-1.5"> 
          <Label htmlFor="title" className="text-comic-black font-bold font-sans">Title <span className="text-comic-red">*</span></Label> 
          <Input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} placeholder="Super Cool Gadget" className="border-2 border-comic-black rounded-md shadow-comic-sm focus-visible:ring-comic-blue focus-visible:ring-offset-1 font-sans" />
        </div>
        {/* Поле Description */}
        <div className="grid w-full gap-1.5">
          <Label htmlFor="description" className="text-comic-black font-bold font-sans">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSubmitting} placeholder="Why it's awesome..." className="border-2 border-comic-black rounded-md shadow-comic-sm focus-visible:ring-comic-blue focus-visible:ring-offset-1 font-sans" />
        </div>
        {/* Поле Link */}
         <div className="grid w-full items-center gap-1.5">
           <Label htmlFor="link" className="text-comic-black font-bold font-sans">Link</Label>
           <Input type="url" id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/product" disabled={isSubmitting} className="border-2 border-comic-black rounded-md shadow-comic-sm focus-visible:ring-comic-blue focus-visible:ring-offset-1 font-sans" />
         </div>
        {/* Поле Image URL */}
        <div className="grid w-full items-center gap-1.5">
           <Label htmlFor="imageUrl" className="text-comic-black font-bold font-sans">Image URL</Label>
           <Input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" disabled={isSubmitting} className="border-2 border-comic-black rounded-md shadow-comic-sm focus-visible:ring-comic-blue focus-visible:ring-offset-1 font-sans" />
         </div>
        {/* Отображение ошибки */}
        {error && ( <div className="p-2 text-sm border-2 border-comic-red bg-red-100 text-comic-red rounded-md font-sans font-bold"> 💥 Oops! {error} </div> )}
        {/* Кнопка Submit */}
         <Button type="submit" className="w-full font-heading text-lg border-2 border-comic-black rounded-md shadow-comic hover:shadow-comic-sm active:shadow-none disabled:opacity-70 bg-comic-yellow text-comic-black hover:bg-primary-dark" disabled={isSubmitting} variant="default" >
           {isSubmitting ? 'ADDING...' : 'ADD IT!'} 
         </Button>
      </form>
    </div>
  );
};

export default AddItemForm;