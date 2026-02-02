'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS, SHADOWS, SPACING, RADIUS, SPOT_COLORS } from '../constants/theme';

const SPOT_TYPES = [
  { id: 'smoking', label: '喫煙所', emoji: '🚬', color: SPOT_COLORS.smoking },
  { id: 'toilet', label: 'トイレ', emoji: '🚻', color: SPOT_COLORS.toilet },
  { id: 'cafe', label: 'カフェ', emoji: '☕', color: SPOT_COLORS.cafe },
];

export default function AddSpotScreen() {
  const router = useRouter();
  const { user, isMember } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState('smoking');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!isMember) {
      Alert.alert(
        'メンバー専用',
        'スポットを追加するにはログインが必要です',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [isMember]);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報の許可が必要です');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());

      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (place) {
          const addr = [place.city, place.district, place.street, place.streetNumber]
            .filter(Boolean)
            .join(' ');
          if (addr) setAddress(addr);
        }
      } catch (e) {
        console.log('Reverse geocoding failed:', e);
      }
    } catch (error) {
      Alert.alert('位置情報の取得に失敗しました');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', 'スポット名を入力してください');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('エラー', '位置情報を設定してください');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('エラー', '正しい座標を入力してください');
      return;
    }

    setLoading(true);
    try {
      const spotData = {
        name: name.trim(),
        type,
        lat,
        lng,
        address: address.trim() || '住所未設定',
        description: description.trim() || '',
        isPublic: false,
        submittedBy: user?.uid || 'anonymous',
        submittedByEmail: user?.email || 'anonymous',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'userSpots'), spotData);

      Alert.alert(
        '登録完了',
        'スポットが追加されました！',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error adding spot:', error);
      Alert.alert('エラー', 'スポットの追加に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (!isMember) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const selectedType = SPOT_TYPES.find(t => t.id === type);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: selectedType?.color.bg || COLORS.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>{selectedType?.emoji || '📍'}</Text>
          <Text style={styles.headerTitle}>新しいスポットを追加</Text>
          <Text style={styles.headerSubtitle}>見つけた穴場を共有しよう</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCard}>
            {/* Spot Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>スポットの種類</Text>
              <View style={styles.typeContainer}>
                {SPOT_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeButton,
                      type === item.id && styles.typeButtonActive,
                      type === item.id && { borderColor: item.color.text },
                    ]}
                    onPress={() => setType(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIconBg, { backgroundColor: item.color.bg }]}>
                      <Text style={styles.typeEmoji}>{item.emoji}</Text>
                    </View>
                    <Text style={[
                      styles.typeLabel,
                      type === item.id && { color: item.color.text, fontWeight: '600' },
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>スポット名 *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例: 梅田駅前 喫煙所"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.label}>位置情報 *</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={gettingLocation}
                activeOpacity={0.8}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.textLight} />
                ) : (
                  <>
                    <Text style={styles.locationButtonIcon}>📍</Text>
                    <Text style={styles.locationButtonText}>
                      {latitude ? '位置情報を再取得' : '現在地を取得'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {latitude && longitude && (
                <View style={styles.coordDisplay}>
                  <Text style={styles.coordText}>
                    緯度: {parseFloat(latitude).toFixed(6)}
                  </Text>
                  <Text style={styles.coordText}>
                    経度: {parseFloat(longitude).toFixed(6)}
                  </Text>
                </View>
              )}

              <View style={styles.coordRow}>
                <View style={styles.coordInput}>
                  <Text style={styles.coordLabel}>緯度</Text>
                  <TextInput
                    style={styles.input}
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="34.702485"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.coordInput}>
                  <Text style={styles.coordLabel}>経度</Text>
                  <TextInput
                    style={styles.input}
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="135.495951"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.label}>住所</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="大阪市北区梅田1-1-1"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>説明・メモ</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="営業時間や注意点など..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Buttons */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.textLight} />
                ) : (
                  <>
                    <Text style={styles.submitIcon}>✓</Text>
                    <Text style={styles.submitButtonText}>スポットを登録</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Content
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: -SPACING.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    minHeight: 600,
    ...SHADOWS.medium,
  },

  // Sections
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  // Type Selection
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
  },
  typeIconBg: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Input
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },

  // Location
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  locationButtonIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  locationButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  coordDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
  },
  coordText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  coordRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  coordInput: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },

  // Buttons
  buttonSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitIcon: {
    fontSize: 18,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.textLight,
    fontSize: 17,
    fontWeight: '700',
  },
  cancelButton: {
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
});
