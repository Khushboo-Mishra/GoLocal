import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Svg, Path, Line, Polyline, Circle } from 'react-native-svg';
import { useTheme } from '@/theme';
import type { PostType } from '@/types';
import { useLocation } from '@/hooks/useLocation';
import { postsApi } from '@/services/api/client';

const IMAGE_LIMIT_BYTES = 10 * 1024 * 1024; // 10MB — matches backend IMAGE_LIMIT in routes/posts.ts
const VIDEO_LIMIT_BYTES = 50 * 1024 * 1024; // 50MB — matches backend VIDEO_LIMIT in routes/posts.ts

// The backend only knows event/hangout/deal — "Post" maps to 'hangout'.
// Deal isn't offered in this UI yet.
const TYPES: { key: PostType; label: string }[] = [
  { key: 'event', label: 'Event' },
  { key: 'hangout', label: 'Post' },
];

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

function MediaIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function PinIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx={12} cy={10} r={3} />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function CreatePostScreen() {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const router = useRouter();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [type, setType] = useState<PostType>('hangout');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function pickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMediaError('Photo library access is required to add media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    const limit = isVideo ? VIDEO_LIMIT_BYTES : IMAGE_LIMIT_BYTES;

    if (asset.fileSize && asset.fileSize > limit) {
      setMediaError(
        `${isVideo ? 'Video' : 'Image'} is too large — must be under ${limit / (1024 * 1024)}MB.`
      );
      return;
    }

    setMediaError(null);
    setMedia(asset);
  }

  function onChangeDate(_event: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    setEventDate((prev) => {
      const next = prev ? new Date(prev) : new Date();
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return next;
    });
  }

  function onChangeTime(_event: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!selected) return;
    setEventDate((prev) => {
      const next = prev ? new Date(prev) : new Date();
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError('Add a title for your post.');
      return;
    }
    if (location.lat == null || location.lng == null) {
      setSubmitError("We need your location to post — check Settings and try again.");
      return;
    }
    if (!locationConfirmed) {
      setSubmitError('Confirm your location to post.');
      return;
    }
    if (type === 'event' && !eventDate) {
      setSubmitError('Pick a date and time for your event.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (media) {
        const isVideo = media.type === 'video';
        formData.append('file', {
          uri: media.uri,
          name: media.fileName ?? (isVideo ? 'upload.mp4' : 'upload.jpg'),
          type: media.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
        } as unknown as Blob);
      }
      formData.append('type', type);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
      if (type === 'event' && eventDate) {
        formData.append('eventTime', eventDate.toISOString());
      }

      await postsApi.create(formData);
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      const apiError = e?.response?.data?.error;
      setSubmitError(
        typeof apiError === 'string' ? apiError : 'Upload failed. Check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const locationReady = location.status === 'success' && location.lat != null && location.lng != null;
  const canSubmit =
    !submitting &&
    locationReady &&
    title.trim().length > 0 &&
    (type !== 'event' || !!eventDate);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <CloseIcon color={c.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>New Post</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.postBtn,
            { backgroundColor: c.brand, opacity: canSubmit ? 1 : 0.5 },
            tokens.shadows.button,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInk} size="small" />
          ) : (
            <Text style={[styles.postBtnText, { color: c.brandInk }]}>Post</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type selector */}
          <View style={styles.typeRow}>
            {TYPES.map(({ key, label }) => {
              const isActive = type === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setType(key);
                  }}
                  style={[
                    styles.typePill,
                    isActive
                      ? {
                          backgroundColor: c.brand,
                          borderColor: 'transparent',
                          shadowColor: c.brand,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.45,
                          shadowRadius: 14,
                          elevation: 4,
                        }
                      : {
                          backgroundColor: c.surface,
                          borderColor: c.border,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.typePillLabel,
                      { color: isActive ? c.brandInk : c.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Media picker */}
          <Pressable
            onPress={pickMedia}
            style={[
              styles.mediaBox,
              {
                borderColor: media ? 'transparent' : c.border,
                backgroundColor: c.surface,
              },
            ]}
          >
            {media ? (
              media.type === 'video' ? (
                <Video
                  source={{ uri: media.uri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls
                  isLooping
                />
              ) : (
                <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              )
            ) : (
              <View style={styles.mediaPlaceholder}>
                <MediaIcon color={c.textTertiary} />
                <Text style={[styles.mediaPlaceholderText, { color: c.textSecondary }]}>
                  Add a photo or video (optional)
                </Text>
              </View>
            )}

            {media && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setMedia(null);
                }}
                style={[styles.mediaRemove, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
              >
                <CloseIcon color="#fff" />
              </Pressable>
            )}
          </Pressable>
          {mediaError && (
            <Text style={[styles.fieldError, { color: '#e05252' }]}>{mediaError}</Text>
          )}

          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Title</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary },
              ]}
              placeholder="What's happening?"
              placeholderTextColor={c.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary },
              ]}
              placeholder="Add some details (optional)"
              placeholderTextColor={c.textTertiary}
              value={description}
              onChangeText={setDescription}
              maxLength={300}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Event time */}
          {type === 'event' && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>When</Text>
              <View style={styles.eventTimeRow}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.eventTimeBtn, { backgroundColor: c.surface, borderColor: c.border }]}
                >
                  <CalendarIcon color={c.textSecondary} />
                  <Text style={[styles.eventTimeText, { color: eventDate ? c.textPrimary : c.textTertiary }]}>
                    {eventDate ? formatDate(eventDate) : 'Date'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  style={[styles.eventTimeBtn, { backgroundColor: c.surface, borderColor: c.border }]}
                >
                  <CalendarIcon color={c.textSecondary} />
                  <Text style={[styles.eventTimeText, { color: eventDate ? c.textPrimary : c.textTertiary }]}>
                    {eventDate ? formatTime(eventDate) : 'Time'}
                  </Text>
                </Pressable>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={eventDate ?? new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onChangeDate}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={eventDate ?? new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeTime}
                />
              )}
            </View>
          )}

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Location</Text>

            {(location.status === 'idle' || location.status === 'loading') && (
              <View style={[styles.locationRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ActivityIndicator color={c.brand} size="small" />
                <Text style={[styles.locationText, { color: c.textSecondary }]}>
                  Finding your location…
                </Text>
              </View>
            )}

            {(location.status === 'denied' || location.status === 'error') && (
              <View style={[styles.locationRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                <PinIcon color="#e05252" />
                <Text style={[styles.locationText, { color: '#e05252' }]}>
                  {location.status === 'denied'
                    ? 'Location access is off — enable it in Settings to post.'
                    : (location.error ?? "Couldn't get your location.")}
                </Text>
              </View>
            )}

            {locationReady && (
              <Pressable
                onPress={() => setLocationConfirmed((v) => !v)}
                style={[styles.locationRow, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <PinIcon color={c.brand} />
                <Text style={[styles.locationText, { color: c.textPrimary }]} numberOfLines={1}>
                  Posting from {location.lat!.toFixed(3)}, {location.lng!.toFixed(3)}
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: locationConfirmed ? c.brand : c.border,
                      backgroundColor: locationConfirmed ? c.brand : 'transparent',
                    },
                  ]}
                >
                  {locationConfirmed && (
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                      stroke={c.brandInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Polyline points="20 6 9 17 4 12" />
                    </Svg>
                  )}
                </View>
              </Pressable>
            )}
          </View>

          {submitError && (
            <Text style={[styles.fieldError, { color: '#e05252' }]}>{submitError}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  postBtn: {
    minWidth: 64,
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingBottom: 140,
    gap: 18,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  typePillLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  mediaBox: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mediaPlaceholderText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  mediaRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  fieldError: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
    marginTop: -8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  eventTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  eventTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  eventTimeText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  locationText: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
