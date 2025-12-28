import { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, Keyboard, Alert, Share, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useIdeas } from '@/context/ideas-context';
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

export default function NoteDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { ideas, updateIdea, togglePinned, toggleArchived } = useIdeas();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Normalize id to string | undefined
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const idea = id ? ideas.find((i) => i.id === id) : undefined;
  const isPinned = idea?.isPinned === true;
  const isArchived = idea?.isArchived === true;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(idea?.text ?? '');
  const [originalText, setOriginalText] = useState(idea?.text ?? '');
  const trimmedDraft = draftText.trim();
  const isDirty = trimmedDraft !== originalText;
  const canSave = isDirty && trimmedDraft.length > 0;

  // Sync draft with context changes (only when not editing)
  useEffect(() => {
    if (!isEditing && idea?.text !== undefined) {
      setDraftText(idea.text);
      setOriginalText(idea.text);
    }
  }, [idea?.text, isEditing]);

  // Unsaved changes confirm on navigation leave
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isEditing || !isDirty) {
        // Allow navigation if not editing or not dirty
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation alert
      Alert.alert('Discard changes?', 'You have unsaved edits. Do you want to discard them?', [
        {
          text: 'Stay',
          style: 'cancel',
          onPress: () => {
            // Do nothing, stay on screen
          },
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            // Exit edit mode and continue navigation
            setIsEditing(false);
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, isEditing, isDirty]);

  // Screen/page background - prevents dark bars in gaps
  const screenBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'icon');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F1F1F' }, 'background');
  const mutedText = useThemeColor({ light: '#687076', dark: '#9BA1A6' }, 'icon');
  const pillBackground = useThemeColor({ light: '#F3F4F6', dark: '#2A2A2A' }, 'background');
  const inputTextColor = useThemeColor({}, 'text');
  const placeholderTextColor = mutedText;

  // Share availability check
  const canShare = idea !== undefined && idea.text?.trim() !== '' && !isEditing && Platform.OS !== 'web';

  const handleShare = async () => {
    if (!canShare || !idea) {
      return;
    }

    const categoryEmoji = {
      App: '📱',
      Content: '📝',
      Random: '🎲',
    }[idea.category] || '📝';

    const dateStr = formatIdeaDate(idea.createdAt);
    const textStr = idea.text?.trim() || '';

    const message = `${categoryEmoji} ${idea.category}\n${dateStr}\n\n${textStr}`;

    try {
      await Share.share({ message });
    } catch (error) {
      // Silent fail - native share sheet handles errors
    }
  };

  if (!idea) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: screenBackground }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={[styles.header, { paddingTop: 20 + insets.top }]} lightColor={screenBackground} darkColor={screenBackground}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
        </ThemedView>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.notFoundTitle}>Note not found</ThemedText>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.notFoundSubtext}>
            This note may have been deleted or doesn't exist.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const categoryEmoji = {
    App: '📱',
    Content: '📝',
    Random: '🎲',
  }[idea.category];

  return (
    <ThemedView style={[styles.container, { backgroundColor: screenBackground }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: screenBackground }]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 20 + insets.top, backgroundColor: screenBackground }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        {/* Header: Back button + Title + Actions */}
        <ThemedView style={styles.header} lightColor={screenBackground} darkColor={screenBackground}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>Note</ThemedText>
          {!isEditing && idea && (
            <ThemedView style={[styles.headerActions, { backgroundColor: screenBackground }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerIconButton,
                  { backgroundColor: isPinned ? pillBackground : 'transparent' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => togglePinned(idea.id)}
                disabled={isEditing}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isPinned ? 'Unpin note' : 'Pin note'}
                accessibilityHint={isPinned ? 'Removes pin from this note' : 'Pins this note to the top'}
                accessibilityState={{ selected: isPinned, disabled: isEditing }}>
                <ThemedText style={[styles.headerIconText, isPinned && { opacity: 1 }]}>📌</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.headerIconButton,
                  { backgroundColor: isArchived ? pillBackground : 'transparent' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleArchived(idea.id)}
                disabled={isEditing}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isArchived ? 'Unarchive note' : 'Archive note'}
                accessibilityHint={isArchived ? 'Moves note back to inbox' : 'Archives this note'}
                accessibilityState={{ selected: isArchived, disabled: isEditing }}>
                <ThemedText style={[styles.headerIconText, isArchived && { opacity: 1 }]}>🗄️</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.headerIconButton,
                  { backgroundColor: 'transparent' },
                  !canShare && { opacity: 0.4 },
                  pressed && canShare && { opacity: 0.7 },
                ]}
                onPress={handleShare}
                disabled={!canShare}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share note"
                accessibilityHint="Opens the share sheet"
                accessibilityState={{ disabled: !canShare }}>
                <ThemedText style={styles.headerIconText}>↗️</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setOriginalText(idea.text);
                  setDraftText(idea.text);
                  setIsEditing(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit note"
                accessibilityHint="Opens edit mode">
                <ThemedText style={styles.editButtonText}>Edit</ThemedText>
              </Pressable>
            </ThemedView>
          )}
        </ThemedView>

        {/* Card: Category pill + Meta */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedView style={[styles.categoryPill, { backgroundColor: pillBackground, borderColor }]}>
            <ThemedText style={styles.categoryPillText}>
              {categoryEmoji} {idea.category}
            </ThemedText>
          </ThemedView>
          <ThemedText lightColor={mutedText} darkColor={mutedText} style={styles.metaDate}>
            {formatIdeaDate(idea.createdAt)}
          </ThemedText>
        </ThemedView>

        {/* Body: Main text or edit input */}
        <ThemedView style={[styles.card, styles.bodyCard, { backgroundColor: cardBackground, borderColor }]}>
          {isEditing ? (
            <>
              <TextInput
                style={[styles.bodyTextInput, { color: inputTextColor }]}
                value={draftText}
                onChangeText={setDraftText}
                multiline
                textAlignVertical="top"
                placeholder="Edit your note..."
                placeholderTextColor={placeholderTextColor}
                autoCapitalize="sentences"
                autoFocus={true}
                accessibilityLabel="Note text"
                accessibilityHint="Edit the note content"
              />
              <ThemedView style={[styles.editActions, { backgroundColor: cardBackground }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    { backgroundColor: pillBackground, borderColor },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    setDraftText(originalText);
                    setIsEditing(false);
                    Keyboard.dismiss();
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
                  accessibilityHint="Discards changes and exits edit mode">
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    canSave ? { backgroundColor: '#3B82F6' } : { backgroundColor: mutedText, opacity: 0.5 },
                    pressed && canSave && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    if (canSave && idea) {
                      updateIdea(idea.id, { text: trimmedDraft });
                      setIsEditing(false);
                      Keyboard.dismiss();
                    }
                  }}
                  disabled={!canSave}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Save changes"
                  accessibilityHint="Saves the edited note"
                  accessibilityState={{ disabled: !canSave }}>
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                </Pressable>
              </ThemedView>
            </>
          ) : (
            <ThemedText style={styles.bodyText}>{idea.text}</ThemedText>
          )}
        </ThemedView>
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
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 18,
    opacity: 0.6,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  metaDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  bodyCard: {
    minHeight: 200,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyTextInput: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    minHeight: 200,
    padding: 0,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  notFoundSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
});

