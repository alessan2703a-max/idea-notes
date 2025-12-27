import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type IdeaCategory = 'App' | 'Content' | 'Random';

export type Idea = {
  id: string;
  text: string;
  category: IdeaCategory;
  isOutside: boolean;
  createdAt: number;
};

type IdeasContextType = {
  ideas: Idea[];
  addIdea: (input: { text: string; category: IdeaCategory; isOutside: boolean }) => void;
  removeIdea: (id: string) => void;
  clearIdeas: () => void;
};

const IdeasContext = createContext<IdeasContextType | undefined>(undefined);

const STORAGE_KEY = 'idea-notes:ideas:v1';

export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const hasHydratedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Hydration: Load ideas from storage on mount
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data !== null) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && isMountedRef.current) {
            setIdeas(parsed);
          }
        }
      } catch (error) {
        // Corrupt or invalid data: fallback to empty array
        if (__DEV__) {
          console.warn('Failed to load ideas from storage:', error);
        }
      } finally {
        hasHydratedRef.current = true;
      }
    };

    loadIdeas();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Autosave: Save ideas to storage whenever they change
  useEffect(() => {
    if (!hasHydratedRef.current) {
      return; // Skip save during initial hydration
    }

    const saveIdeas = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
      } catch (error) {
        // Log error but don't crash the app
        if (__DEV__) {
          console.warn('Failed to save ideas to storage:', error);
        }
      }
    };

    saveIdeas();
  }, [ideas]);

  const addIdea = (input: { text: string; category: IdeaCategory; isOutside: boolean }) => {
    const newIdea: Idea = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: input.text,
      category: input.category,
      isOutside: input.isOutside,
      createdAt: Date.now(),
    };
    setIdeas((prev) => [...prev, newIdea]);
  };

  const removeIdea = (id: string) => {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
  };

  const clearIdeas = () => {
    setIdeas([]);
  };

  return (
    <IdeasContext.Provider value={{ ideas, addIdea, removeIdea, clearIdeas }}>
      {children}
    </IdeasContext.Provider>
  );
}

export function useIdeas() {
  const context = useContext(IdeasContext);
  if (context === undefined) {
    throw new Error('useIdeas must be used within an IdeasProvider');
  }
  return context;
}

