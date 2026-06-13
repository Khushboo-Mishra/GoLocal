import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Svg, Path, Line, Polyline, Circle } from 'react-native-svg';
import { useTheme } from '@/theme';
import { useLocation } from '@/hooks/useLocation';
import { usersApi, feedApi } from '@/services/api/client';
import { useAuthStore } from '@/services/stores/authStore';
import { PostCard } from '@/components/cards/PostCard';
import { Avatar } from '@/components/cards/shared/Avatar';
import { useCommentSheet } from '@/components/sheets/CommentSheetProvider';

const AVATAR_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB — matches backend avatar cap in routes/users.ts
const RADIUS_OPTIONS: (1 | 3 | 5)[] = [1, 3, 5];

function toRadius(n: number): 1 | 3 | 5 {
  return n === 1 || n === 5 ? n : 3;
}

function EditIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </Svg>
  );
}

function LogOutIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();
  const { openCommentSheet } = useCommentSheet();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(),
  });
  const profile = data?.user;

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [radiusInput, setRadiusInput] = useState<1 | 3 | 5>(3);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // ── My posts ────────────────────────────────────────────────
  // NOTE: there's no dedicated "my posts" endpoint yet, so we reuse
  // the nearby feed (at the max 10mi radius) and filter client-side
  // by userId. A GET /users/me/posts endpoint would be cleaner and
  // wouldn't depend on the device's current location.
  const myPostsQuery = useQuery({
    queryKey: ['myPosts', profile?.id, location.lat, location.lng],
    queryFn: () =>
      feedApi.getNearby({ lat: location.lat as number, lng: location.lng as number, radius: 10 }),
    enabled: !!profile && location.lat != null && location.lng != null,
  });
  const myPosts = (myPostsQuery.data?.posts ?? []).filter((p) => p.userId === profile?.id);

  function startEditing() {
    if (!profile) return;
    setNameInput(profile.name);
    setRadiusInput(toRadius(profile.radiusMiles));
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!nameInput.trim()) {
      setSaveError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { user: updated } = await usersApi.updateMe({
        name: nameInput.trim(),
        radiusMiles: radiusInput,
      });
      queryClient.setQueryData(['me'], { user: updated });
      setUser(updated);
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      setSaveError('Could not save changes. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError('Photo library access is required to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > AVATAR_LIMIT_BYTES) {
      setAvatarError(`Image is too large — must be under ${AVATAR_LIMIT_BYTES / (1024 * 1024)}MB.`);
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      const { avatarUrl } = await usersApi.uploadAvatar(formData);
      queryClient.setQueryData(['me'], (old: any) =>
        old ? { user: { ...old.user, avatarUrl } } : old
      );
      if (profile) setUser({ ...profile, avatarUrl });
    } catch (e: any) {
      const apiError = e?.response?.data?.error;
      setAvatarError(
        typeof apiError === 'string'
          ? apiError
          : "Avatar upload failed — Cloudflare R2 isn't configured locally."
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <ActivityIndicator color={c.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: c.textPrimary }]}>Couldn't load your profile</Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.actionBtn, { backgroundColor: c.brand }, tokens.shadows.button]}
          >
            <Text style={[styles.actionBtnText, { color: c.brandInk }]}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Profile</Text>
        <View style={styles.headerActions}>
          {savedFlash && (
            <Text style={[styles.savedFlash, { color: c.brand }]}>Saved</Text>
          )}
          {editing ? (
            <>
              <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[
                  styles.savePill,
                  { backgroundColor: c.brand, opacity: saving ? 0.6 : 1 },
                  tokens.shadows.button,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={c.brandInk} size="small" />
                ) : (
                  <Text style={[styles.savePillText, { color: c.brandInk }]}>Save</Text>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={startEditing}
              style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <EditIcon color={c.textSecondary} />
            </Pressable>
          )}
          <Pressable
            onPress={handleSignOut}
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <LogOutIcon color={c.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Avatar
                initial={profile.name.charAt(0).toUpperCase()}
                gradient={[c.brand, c.brandDeep]}
                size={84}
              />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: c.brand, borderColor: c.bg }]}>
              {avatarUploading ? (
                <ActivityIndicator color={c.brandInk} size="small" />
              ) : (
                <CameraIcon color={c.brandInk} />
              )}
            </View>
          </Pressable>
          {avatarError && (
            <Text style={[styles.fieldError, { color: '#e05252' }]}>{avatarError}</Text>
          )}
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Name</Text>
          {editing ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary },
              ]}
              value={nameInput}
              onChangeText={setNameInput}
              maxLength={60}
              placeholder="Your name"
              placeholderTextColor={c.textTertiary}
            />
          ) : (
            <Text style={[styles.profileName, { color: c.textPrimary }]}>{profile.name}</Text>
          )}
        </View>

        {/* Search radius */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Search radius</Text>
          {editing ? (
            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map((r) => {
                const isActive = radiusInput === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRadiusInput(r)}
                    style={[
                      styles.radiusPill,
                      isActive
                        ? { backgroundColor: c.brand, borderColor: 'transparent' }
                        : { backgroundColor: c.surface, borderColor: c.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.radiusPillText,
                        { color: isActive ? c.brandInk : c.textSecondary },
                      ]}
                    >
                      {r} mi
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.profileValue, { color: c.textPrimary }]}>
              {profile.radiusMiles} mi
            </Text>
          )}
        </View>

        {saveError && (
          <Text style={[styles.fieldError, { color: '#e05252' }]}>{saveError}</Text>
        )}

        {/* My posts */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Your posts</Text>

          {myPostsQuery.isLoading && (
            <View style={styles.centerStateSmall}>
              <ActivityIndicator color={c.brand} />
            </View>
          )}

          {myPostsQuery.isError && (
            <Text style={[styles.stateBody, { color: c.textSecondary }]}>
              Couldn't load your posts.
            </Text>
          )}

          {!myPostsQuery.isLoading && !myPostsQuery.isError && myPosts.length === 0 && (
            <Text style={[styles.stateBody, { color: c.textSecondary }]}>
              You haven't posted yet.
            </Text>
          )}

          {myPosts.length > 0 && (
            <View style={styles.postsList}>
              {myPosts.map((post) => (
                <PostCard key={post.id} post={post} onCommentPress={() => openCommentSheet(post.id)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedFlash: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 4,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13.5,
  },
  savePill: {
    minWidth: 64,
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingBottom: 140,
    gap: 18,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
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
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
  },
  profileName: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  profileValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 15,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  radiusPillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  postsList: {
    gap: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  centerStateSmall: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  stateTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  actionBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
  },
  actionBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
});
