import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type IdeaCategory = 'App' | 'Content' | 'Random';

export type Idea = {
  id: string;
  text: string;
  category: IdeaCategory;
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt: number;
};

type IdeasContextType = {
  ideas: Idea[];
  addIdea: (input: { text: string; category: IdeaCategory }) => void;
  removeIdea: (id: string) => void;
  clearIdeas: () => void;
  updateIdea: (id: string, updates: { text?: string; category?: IdeaCategory; isPinned?: boolean; isArchived?: boolean }) => void;
  togglePinned: (id: string) => void;
  toggleArchived: (id: string) => void;
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
            // Normalize: ensure isPinned and isArchived exist (backward compatible)
            const normalized = parsed.map((idea) => ({
              ...idea,
              isPinned: idea.isPinned ?? false,
              isArchived: idea.isArchived ?? false,
            }));
            setIdeas(normalized);
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

  const addIdea = (input: { text: string; category: IdeaCategory }) => {
    const newIdea: Idea = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: input.text,
      category: input.category,
      isPinned: false,
      isArchived: false,
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

  const updateIdea = (id: string, updates: { text?: string; category?: IdeaCategory; isPinned?: boolean; isArchived?: boolean }) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === id) {
          // Merge updates while preserving id and createdAt
          return {
            ...idea,
            ...updates,
            id: idea.id, // Ensure id cannot be overwritten
            createdAt: idea.createdAt, // Ensure createdAt cannot be overwritten
          };
        }
        return idea;
      })
    );
  };

  const togglePinned = (id: string) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === id) {
          const newPinnedState = !(idea.isPinned ?? false);
          // Pinning (to true) unarchives automatically
          return {
            ...idea,
            isPinned: newPinnedState,
            isArchived: newPinnedState ? false : idea.isArchived, // Unpin preserves archive state
            id: idea.id,
            createdAt: idea.createdAt,
          };
        }
        return idea;
      })
    );
  };

  const toggleArchived = (id: string) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === id) {
          const newArchivedState = !(idea.isArchived ?? false);
          // Archiving (to true) unpins automatically
          return {
            ...idea,
            isArchived: newArchivedState,
            isPinned: newArchivedState ? false : idea.isPinned, // Unarchive preserves pin state
            id: idea.id,
            createdAt: idea.createdAt,
          };
        }
        return idea;
      })
    );
  };

  return (
    <IdeasContext.Provider value={{ ideas, addIdea, removeIdea, clearIdeas, updateIdea, togglePinned, toggleArchived }}>
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

