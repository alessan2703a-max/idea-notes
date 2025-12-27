import { Alert, FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useIdeas, type Idea } from '@/context/ideas-context';
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

export default function TabTwoScreen() {
  const { ideas, removeIdea, clearIdeas } = useIdeas();
  const sortedIdeas = [...ideas].sort((a, b) => b.createdAt - a.createdAt);
  const insets = useSafeAreaInsets();
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'icon');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F1F1F' }, 'background');
  const mutedText = useThemeColor({ light: '#687076', dark: '#9BA1A6' }, 'icon');
  const pillBackground = useThemeColor({ light: '#F3F4F6', dark: '#2A2A2A' }, 'background');

  const renderIdea = ({ item }: { item: Idea }) => {
    const categoryEmoji = {
      App: '📱',
      Content: '📝',
      Random: '🎲',
    }[item.category];

    return (
      <ThemedView style={[styles.card, styles.ideaCard, { backgroundColor: cardBackground, borderColor }]}>
        {/* Header: Category pill + Delete icon */}
        <ThemedView style={styles.cardHeader} lightColor="#fff" darkColor="#1F1F1F">
          <ThemedView style={[styles.categoryPill, { backgroundColor: pillBackground, borderColor }]}>
            <ThemedText style={styles.categoryPillText}>
              {categoryEmoji} {item.category}
              {item.isOutside ? ' 🍃' : ''}
            </ThemedText>
          </ThemedView>
          <Pressable
            style={({ pressed }) => [
              styles.deleteIconButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => removeIdea(item.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Delete idea"
            accessibilityHint="Removes this idea from your inbox">
            <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
          </Pressable>
        </ThemedView>

        {/* Body: Main text */}
        <ThemedText style={styles.ideaText}>{item.text}</ThemedText>

        {/* Footer: Date */}
        <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.ideaDate}>
          {formatIdeaDate(item.createdAt)}
        </ThemedText>
      </ThemedView>
    );
  };

  const handleClearAll = () => {
    Alert.alert('Clear inbox?', 'This will remove all ideas.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearIdeas },
    ]);
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
            {ideas.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.85 }]}
                onPress={handleClearAll}
                accessibilityRole="button"
                accessibilityLabel="Clear all ideas">
                <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
              </Pressable>
            )}
          </ThemedView>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.headerSubtitle}>
            Your saved ideas and notes show up here.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {ideas.length === 0 ? (
        <ThemedView style={[styles.card, styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.emptyStateText}>
            Inbox is empty
          </ThemedText>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.emptyStateSubtext}>
            Capture an idea to see it here.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={sortedIdeas}
          renderItem={renderIdea}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
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
  deleteIconButton: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteIcon: {
    fontSize: 18,
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
});
