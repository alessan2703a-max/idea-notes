import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Keyboard, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useIdeas, type Idea, type IdeaCategory } from '@/context/ideas-context';
import { useThemeColor } from '@/hooks/use-theme-color';

function formatIdeaDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function measureDropdown(
  ref: React.RefObject<View | null>,
  callback: (rect: AnchorRect) => void
) {
  ref.current?.measureInWindow((x, y, width, height) => {
    callback({ x, y, width, height });
  });
}

function calculateMenuPosition(
  anchorRect: AnchorRect,
  menuWidth: number,
  menuHeight: number,
  offset: number = 8
): { top: number; left: number } {
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const padding = 16;

  // Start met positionering onder de anchor
  let top = anchorRect.y + anchorRect.height + offset;
  let left = anchorRect.x;

  // Clamp horizontaal: zorg dat menu volledig binnen scherm blijft
  left = Math.max(padding, Math.min(left, windowWidth - menuWidth - padding));

  // Als menu rechts buiten scherm valt, clamp naar rechts edge
  if (left + menuWidth > windowWidth - padding) {
    left = windowWidth - menuWidth - padding;
  }

  // Als menu links buiten scherm valt, clamp naar links edge
  if (left < padding) {
    left = padding;
  }

  // Als menu onderkant buiten scherm valt, positioneer boven
  if (top + menuHeight > windowHeight - padding) {
    top = anchorRect.y - menuHeight - offset;
    // Als ook boven niet past, clamp naar onderkant scherm
    if (top < padding) {
      top = windowHeight - menuHeight - padding;
      // Als menu nog steeds te hoog is, clamp naar bovenkant
      if (top < padding) {
        top = padding;
      }
    }
  }

  // Als menu bovenkant buiten scherm valt, clamp naar bovenkant
  if (top < padding) {
    top = padding;
  }

  return { top, left };
}

export default function TabTwoScreen() {
  const { ideas, removeIdea, togglePinned, toggleArchived } = useIdeas();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Dropdown refs
  const categoryDropdownRef = useRef<View>(null);
  const sortDropdownRef = useRef<View>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IdeaCategory | 'All'>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [categoryAnchorRect, setCategoryAnchorRect] = useState<AnchorRect | null>(null);
  const [sortAnchorRect, setSortAnchorRect] = useState<AnchorRect | null>(null);

  // Theme colors
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'icon');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F1F1F' }, 'background');
  const mutedText = useThemeColor({ light: '#687076', dark: '#9BA1A6' }, 'icon');
  const pillBackground = useThemeColor({ light: '#F3F4F6', dark: '#2A2A2A' }, 'background');
  const inputTextColor = useThemeColor({ light: '#11181C', dark: '#ECEDEE' }, 'text');
  const placeholderColor = useThemeColor({ light: '#687076', dark: '#9BA1A6' }, 'icon');
  const dropdownTextColor = useThemeColor({}, 'text');

  // Derived: Filter and sort ideas
  const visibleIdeas = useMemo(() => {
    let filtered = ideas;

    // Archive filter
    if (showArchived) {
      filtered = filtered.filter((item) => item.isArchived === true);
    } else {
      filtered = filtered.filter((item) => item.isArchived !== true);
    }

    // Search filter
    if (searchQuery.trim()) {
      // Normalize query: trim, lowercase, normalize whitespace
      const normalizedQuery = searchQuery.trim().toLowerCase().replace(/\s+/g, ' ');
      filtered = filtered.filter((item) => {
        const normalizedText = item.text.toLowerCase().replace(/\s+/g, ' ');
        return normalizedText.includes(normalizedQuery);
      });
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Sort based on sortOrder
    return [...filtered].sort((a, b) =>
      sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
  }, [ideas, showArchived, searchQuery, selectedCategory, sortOrder]);

  // Split into pinned and regular (only when not showing archived)
  const { pinnedIdeas, regularIdeas } = useMemo(() => {
    if (showArchived) {
      // Archived view: no pinned section
      return { pinnedIdeas: [], regularIdeas: visibleIdeas };
    }
    const pinned = visibleIdeas.filter((item) => item.isPinned === true);
    const regular = visibleIdeas.filter((item) => item.isPinned !== true);
    return { pinnedIdeas: pinned, regularIdeas: regular };
  }, [visibleIdeas, showArchived]);

  const renderIdea = ({ item }: { item: Idea }) => {
    const categoryEmoji = {
      App: '📱',
      Content: '📝',
      Random: '🎲',
    }[item.category];

    return (
      <Pressable
        style={({ pressed }) => pressed && { opacity: 0.9 }}
        onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
        accessibilityRole="button"
        accessibilityLabel="Open note">
        <ThemedView style={[styles.card, styles.ideaCard, { backgroundColor: cardBackground, borderColor }]}>
          {/* Header: Category pill + Delete icon */}
          <ThemedView style={styles.cardHeader} lightColor="#fff" darkColor="#1F1F1F">
            <ThemedView style={[styles.categoryPill, { backgroundColor: pillBackground, borderColor }]}>
              <ThemedText style={styles.categoryPillText}>
                {categoryEmoji} {item.category}
              </ThemedText>
            </ThemedView>
            <ThemedView style={[styles.actionButtons, { backgroundColor: cardBackground }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionIconButton,
                  { backgroundColor: 'transparent' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  togglePinned(item.id);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={item.isPinned ? 'Unpin note' : 'Pin note'}
                accessibilityHint={item.isPinned ? 'Removes pin from this note' : 'Pins this note to the top'}>
                <ThemedText style={[styles.actionIcon, item.isPinned && { opacity: 1 }]}>📌</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionIconButton,
                  { backgroundColor: 'transparent' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  toggleArchived(item.id);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={item.isArchived ? 'Unarchive note' : 'Archive note'}
                accessibilityHint={item.isArchived ? 'Moves note back to inbox' : 'Archives this note'}>
                <ThemedText style={[styles.actionIcon, item.isArchived && { opacity: 1 }]}>🗄️</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionIconButton,
                  { backgroundColor: 'transparent' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  removeIdea(item.id);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
                accessibilityHint="Removes this note from your inbox">
                <ThemedText style={styles.actionIcon}>🗑️</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* Body: Main text */}
          <ThemedText style={styles.ideaText}>{item.text}</ThemedText>

          {/* Footer: Date */}
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.ideaDate}>
            {formatIdeaDate(item.createdAt)}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: 20 + insets.top }]}>
        <ThemedView style={styles.badge}>
          <ThemedText style={styles.badgeEmoji}>📬</ThemedText>
        </ThemedView>
        <ThemedView style={styles.headerText}>
          <ThemedView style={styles.headerTop}>
            <ThemedText type="title" style={styles.headerTitle}>Inbox</ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: pillBackground, borderColor },
                showArchived && styles.clearButtonSelected,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setShowArchived((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showArchived ? 'Hide archived notes' : 'Show archived notes'}
              accessibilityState={{ selected: showArchived }}>
              <ThemedText
                lightColor={showArchived ? '#fff' : inputTextColor}
                darkColor={showArchived ? '#fff' : inputTextColor}
                style={[styles.clearButtonText, showArchived && styles.clearButtonTextSelected]}
                numberOfLines={1}>
                {showArchived ? '🗄️ Archived' : '🗄️ Archive'}
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.headerSubtitle}>
            Your saved ideas and notes show up here.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Search bar */}
      <ThemedView style={styles.searchContainer}>
        <ThemedView style={[styles.card, styles.searchCard, { backgroundColor: cardBackground, borderColor }]}>
          <TextInput
            style={[styles.searchInput, { color: inputTextColor }]}
            placeholder="Search notes..."
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="sentences"
            {...(Platform.OS === 'ios' && { clearButtonMode: 'while-editing' })}
            accessibilityLabel="Search notes"
            accessibilityHint="Filters notes by text content"
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.searchClearButton}
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <ThemedText style={styles.searchClearButtonText}>✕</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </ThemedView>

      {/* Controls row: Category + Sort dropdowns */}
      <ThemedView style={styles.controlsRow}>
        {/* Category dropdown */}
        <View ref={categoryDropdownRef} style={{ flex: 1, minHeight: 44 }} collapsable={false}>
          <Pressable
            style={({ pressed }) => [
              styles.dropdownBox,
              selectedCategory !== 'All' && styles.dropdownBoxSelected,
              selectedCategory === 'All' && { backgroundColor: cardBackground, borderColor },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setIsSortMenuOpen(false);
              setCategoryAnchorRect(null); // Reset voor fallback
              measureDropdown(categoryDropdownRef, (rect) => {
                setCategoryAnchorRect(rect);
              });
              setIsCategoryMenuOpen(true);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Category filter"
            accessibilityHint="Opens a menu">
            <ThemedText
              style={[
                styles.dropdownLabel,
                selectedCategory !== 'All' ? styles.dropdownLabelSelected : { color: dropdownTextColor },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {selectedCategory === 'All'
                ? 'All'
                : selectedCategory === 'App'
                  ? '📱 App'
                  : selectedCategory === 'Content'
                    ? '📝 Content'
                    : '🎲 Random'}
            </ThemedText>
            <ThemedText
              style={[
                styles.dropdownChevron,
                selectedCategory !== 'All' ? styles.dropdownChevronSelected : { color: mutedText },
              ]}
              numberOfLines={1}>
              ▾
            </ThemedText>
          </Pressable>
        </View>

        {/* Sort dropdown */}
        <View ref={sortDropdownRef} style={{ flex: 1, minHeight: 44 }} collapsable={false}>
          <Pressable
            style={({ pressed }) => [
              styles.dropdownBox,
              sortOrder !== 'newest' && styles.dropdownBoxSelected,
              sortOrder === 'newest' && { backgroundColor: cardBackground, borderColor },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setIsCategoryMenuOpen(false);
              setSortAnchorRect(null); // Reset voor fallback
              measureDropdown(sortDropdownRef, (rect) => {
                setSortAnchorRect(rect);
              });
              setIsSortMenuOpen(true);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Sort order"
            accessibilityHint="Opens a menu">
            <ThemedText
              style={[
                styles.dropdownLabel,
                sortOrder !== 'newest' ? styles.dropdownLabelSelected : { color: dropdownTextColor },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {sortOrder === 'newest' ? 'Newest ↓' : 'Oldest ↑'}
            </ThemedText>
            <ThemedText
              style={[
                styles.dropdownChevron,
                sortOrder !== 'newest' ? styles.dropdownChevronSelected : { color: mutedText },
              ]}
              numberOfLines={1}>
              ▾
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      {/* Category Modal */}
      <Modal visible={isCategoryMenuOpen} transparent animationType="fade" onRequestClose={() => setIsCategoryMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setIsCategoryMenuOpen(false)}>
          <View
            style={[
              {
                position: 'absolute',
                width: Math.min(300, Dimensions.get('window').width - 32),
              },
              categoryAnchorRect
                ? calculateMenuPosition(categoryAnchorRect, Math.min(300, Dimensions.get('window').width - 32), 220)
                : (() => {
                    const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
                    const menuWidth = Math.min(300, windowWidth - 32);
                    return {
                      top: windowHeight / 2 - 110,
                      left: windowWidth / 2 - menuWidth / 2,
                    };
                  })(),
            ]}>
            <ThemedView style={[styles.menuCard, { backgroundColor: cardBackground, borderColor }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  selectedCategory === 'All' && { backgroundColor: pillBackground },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setSelectedCategory('All');
                  setIsCategoryMenuOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="All categories"
                accessibilityState={{ selected: selectedCategory === 'All' }}>
                <ThemedText style={[styles.menuItemText, { color: inputTextColor }]}>All</ThemedText>
                {selectedCategory === 'All' && <ThemedText style={styles.menuItemCheckmark}>✓</ThemedText>}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  selectedCategory === 'App' && { backgroundColor: pillBackground },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setSelectedCategory('App');
                  setIsCategoryMenuOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="App category"
                accessibilityState={{ selected: selectedCategory === 'App' }}>
                <ThemedText style={[styles.menuItemText, { color: inputTextColor }]}>📱 App</ThemedText>
                {selectedCategory === 'App' && <ThemedText style={styles.menuItemCheckmark}>✓</ThemedText>}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  selectedCategory === 'Content' && { backgroundColor: pillBackground },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setSelectedCategory('Content');
                  setIsCategoryMenuOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Content category"
                accessibilityState={{ selected: selectedCategory === 'Content' }}>
                <ThemedText style={[styles.menuItemText, { color: inputTextColor }]}>📝 Content</ThemedText>
                {selectedCategory === 'Content' && <ThemedText style={styles.menuItemCheckmark}>✓</ThemedText>}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  selectedCategory === 'Random' && { backgroundColor: pillBackground },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setSelectedCategory('Random');
                  setIsCategoryMenuOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Random category"
                accessibilityState={{ selected: selectedCategory === 'Random' }}>
                <ThemedText style={[styles.menuItemText, { color: inputTextColor }]}>🎲 Random</ThemedText>
                {selectedCategory === 'Random' && <ThemedText style={styles.menuItemCheckmark}>✓</ThemedText>}
              </Pressable>
            </ThemedView>
          </View>
        </Pressable>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={isSortMenuOpen} transparent animationType="fade" onRequestClose={() => setIsSortMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setIsSortMenuOpen(false)}>
          <View
            style={[
              {
                position: 'absolute',
                width: Math.min(300, Dimensions.get('window').width - 32),
              },
              sortAnchorRect
                ? calculateMenuPosition(sortAnchorRect, Math.min(300, Dimensions.get('window').width - 32), 140)
                : (() => {
                    const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
                    const menuWidth = Math.min(300, windowWidth - 32);
                    return {
                      top: windowHeight / 2 - 70,
                      left: windowWidth / 2 - menuWidth / 2,
                    };
                  })(),
            ]}>
            <ThemedView style={[styles.menuCard, { backgroundColor: cardBackground, borderColor }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  sortOrder === 'newest' && { backgroundColor: pillBackground },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setSortOrder('newest');
                  setIsSortMenuOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Newest first"
                accessibilityState={{ selected: sortOrder === 'newest' }}>
                <ThemedText style={[styles.menuItemText, { color: inputTextColor }]}>Newest ↓</ThemedText>
                {sortOrder === 'newest' && <ThemedText style={styles.menuItemCheckmark}>✓</ThemedText>}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  sortOrder === 'oldest' && { backgroundColor: pillBackground },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setSortOrder('oldest');
                  setIsSortMenuOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Oldest first"
                accessibilityState={{ selected: sortOrder === 'oldest' }}>
                <ThemedText style={[styles.menuItemText, { color: inputTextColor }]}>Oldest ↑</ThemedText>
                {sortOrder === 'oldest' && <ThemedText style={styles.menuItemCheckmark}>✓</ThemedText>}
              </Pressable>
            </ThemedView>
          </View>
        </Pressable>
      </Modal>

      {ideas.length === 0 ? (
        <ThemedView style={[styles.card, styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.emptyStateText}>
            Inbox is empty
        </ThemedText>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.emptyStateSubtext}>
            Capture an idea to see it here.
        </ThemedText>
        </ThemedView>
      ) : visibleIdeas.length === 0 ? (
        <ThemedView style={[styles.card, styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.emptyStateText}>
            {showArchived ? 'No archived notes found' : 'No results found'}
        </ThemedText>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.emptyStateSubtext}>
            {showArchived ? 'No notes are archived yet.' : 'Try adjusting your search or filters.'}
        </ThemedText>
          {!showArchived && (
            <Pressable
              style={({ pressed }) => [styles.clearFiltersButton, pressed && { opacity: 0.8 }]}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSortOrder('newest');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear filters">
              <ThemedText style={styles.clearFiltersButtonText}>Clear filters</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      ) : (
        <FlatList
          data={regularIdeas}
          renderItem={renderIdea}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          ListHeaderComponent={
            pinnedIdeas.length > 0 ? (
              <ThemedView style={styles.sectionContainer}>
                <ThemedText style={styles.sectionHeader}>📌 Pinned</ThemedText>
                {pinnedIdeas.map((item) => (
                  <View key={item.id}>{renderIdea({ item })}</View>
                ))}
                <ThemedView style={styles.sectionSpacer} />
              </ThemedView>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButtonTextSelected: {
    color: '#fff',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 0,
    gap: 20,
  },
  ideaCard: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  actionIconButton: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  ideaText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    flexShrink: 1,
  },
  ideaDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyState: {
    margin: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  searchClearButton: {
    padding: 4,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearButtonText: {
    fontSize: 18,
    color: '#687076',
  },
  sectionContainer: {
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  sectionSpacer: {
    height: 8,
  },
  clearFiltersButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dropdownBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  dropdownBoxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  dropdownLabelSelected: {
    color: '#fff',
  },
  dropdownChevron: {
    fontSize: 12,
    lineHeight: 20,
    minWidth: 16,
    flexShrink: 0,
  },
  dropdownChevronSelected: {
    color: '#fff',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    minHeight: 44,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  menuItemCheckmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
