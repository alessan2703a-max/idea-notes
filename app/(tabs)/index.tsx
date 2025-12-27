import { useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Switch, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useIdeas } from '@/context/ideas-context';
import { useThemeColor } from '@/hooks/use-theme-color';

type Category = 'App' | 'Content' | 'Random';

export default function HomeScreen() {
  const [ideaText, setIdeaText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Random');
  const [isOutside, setIsOutside] = useState(false);
  const { addIdea } = useIdeas();
  const insets = useSafeAreaInsets();

  const canSubmit = ideaText.trim().length > 0;

  const submitIdea = () => {
    if (!canSubmit) {
      return;
    }
    const text = ideaText.trim();
    addIdea({ text, category: selectedCategory, isOutside });
    setIdeaText('');
    setSelectedCategory('Random');
    setIsOutside(false);
    Keyboard.dismiss();
  };

  const inputTextColor = useThemeColor({ light: '#11181C', dark: '#ECEDEE' }, 'text');
  const placeholderColor = useThemeColor({ light: '#687076', dark: '#9BA1A6' }, 'icon');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F1F1F' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'icon');

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: 20 + insets.top }]}>
        {/* A) Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.badge}>
            <ThemedText style={styles.badgeEmoji}>✨</ThemedText>
          </ThemedView>
          <ThemedView style={styles.headerText}>
            <ThemedText type="title" style={styles.headerTitle}>Capture</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Turn your ideas into reality</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* B) Grote input-card */}
        <ThemedView style={[styles.card, styles.inputCard, { backgroundColor: cardBackground, borderColor }]}>
          <TextInput
            style={[styles.textInput, { color: inputTextColor }]}
            placeholder="What's on your mind?"
            placeholderTextColor={placeholderColor}
            multiline
            textAlignVertical="top"
            value={ideaText}
            onChangeText={setIdeaText}
          />
          <Pressable
            style={({ pressed }) => [styles.recordButton, pressed && { opacity: 0.8 }]}
            onPress={() => Alert.alert('Coming soon', 'Voice notes are not implemented yet.')}
            accessibilityRole="button"
            accessibilityLabel="Record voice note">
            <ThemedText style={styles.recordButtonText}>🎤 Record voice note</ThemedText>
          </Pressable>
        </ThemedView>

        {/* C) Sectielabel */}
        <ThemedText style={styles.sectionLabel}>CHOOSE A CATEGORY</ThemedText>

        {/* D) Categorie-rij */}
        <ThemedView style={styles.categoryRow}>
          <Pressable
            onPress={() => setSelectedCategory('App')}
            style={[
              styles.categoryCard,
              selectedCategory === 'App' ? styles.categoryCardSelected : { backgroundColor: cardBackground, borderColor },
            ]}>
            <ThemedText
              lightColor={selectedCategory === 'App' ? '#fff' : undefined}
              darkColor={selectedCategory === 'App' ? '#fff' : undefined}
              style={styles.categoryEmoji}>
              📱
            </ThemedText>
            <ThemedText
              lightColor={selectedCategory === 'App' ? '#fff' : undefined}
              darkColor={selectedCategory === 'App' ? '#fff' : undefined}
              style={selectedCategory === 'App' ? styles.categoryLabelSelected : styles.categoryLabel}>
              App
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setSelectedCategory('Content')}
            style={[
              styles.categoryCard,
              selectedCategory === 'Content' ? styles.categoryCardSelected : { backgroundColor: cardBackground, borderColor },
            ]}>
            <ThemedText
              lightColor={selectedCategory === 'Content' ? '#fff' : undefined}
              darkColor={selectedCategory === 'Content' ? '#fff' : undefined}
              style={styles.categoryEmoji}>
              📝
            </ThemedText>
            <ThemedText
              lightColor={selectedCategory === 'Content' ? '#fff' : undefined}
              darkColor={selectedCategory === 'Content' ? '#fff' : undefined}
              style={selectedCategory === 'Content' ? styles.categoryLabelSelected : styles.categoryLabel}>
              Content
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setSelectedCategory('Random')}
            style={[
              styles.categoryCard,
              selectedCategory === 'Random' ? styles.categoryCardSelected : { backgroundColor: cardBackground, borderColor },
            ]}>
            <ThemedText
              lightColor={selectedCategory === 'Random' ? '#fff' : undefined}
              darkColor={selectedCategory === 'Random' ? '#fff' : undefined}
              style={styles.categoryEmoji}>
              🎲
            </ThemedText>
            <ThemedText
              lightColor={selectedCategory === 'Random' ? '#fff' : undefined}
              darkColor={selectedCategory === 'Random' ? '#fff' : undefined}
              style={selectedCategory === 'Random' ? styles.categoryLabelSelected : styles.categoryLabel}>
              Random
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* E) Outside card met toggle */}
        <ThemedView style={[styles.card, styles.outsideCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedView style={styles.outsideIcon}>
            <ThemedText style={styles.outsideIconEmoji}>🍃</ThemedText>
          </ThemedView>
          <ThemedView style={styles.outsideText} lightColor="#fff" darkColor="#1F1F1F">
            <ThemedText style={styles.outsideTitle}>Outside</ThemedText>
            <ThemedText style={styles.outsideSubtitle}>Fresh air vibes</ThemedText>
          </ThemedView>
          <Switch value={isOutside} onValueChange={setIsOutside} />
        </ThemedView>

        {/* F) Save button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            !canSubmit && styles.saveButtonDisabled,
            pressed && canSubmit && { opacity: 0.85 },
          ]}
          onPress={submitIdea}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Save idea">
          <ThemedText style={[styles.saveButtonText, !canSubmit && styles.saveButtonTextDisabled]}>
            💾 Save
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.6,
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
  inputCard: {
    padding: 16,
    gap: 16,
  },
  textInput: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
  },
  recordButton: {
    backgroundColor: '#9333EA',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 100,
    justifyContent: 'center',
  },
  categoryCardSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryEmojiSelected: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryLabelSelected: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  outsideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  outsideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outsideIconEmoji: {
    fontSize: 20,
  },
  outsideText: {
    flex: 1,
    gap: 2,
  },
  outsideTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  outsideSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: '#9333EA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.7,
  },
});
