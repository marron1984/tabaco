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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SPOT_TYPES = [
  { id: 'smoking', label: '喫煙所', emoji: '🚬' },
  { id: 'toilet', label: 'トイレ', emoji: '🚻' },
  { id: 'cafe', label: 'カフェ', emoji: '☕' },
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

  // Redirect if not a member
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

      // Try reverse geocoding for address
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
    // Validation
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>新しいスポットを追加</Text>
        <Text style={styles.subtitle}>
          見つけた穴場スポットを共有しましょう
        </Text>

        {/* Spot Type Selection */}
        <Text style={styles.label}>スポットの種類</Text>
        <View style={styles.typeContainer}>
          {SPOT_TYPES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.typeButton,
                type === item.id && styles.typeButtonActive,
              ]}
              onPress={() => setType(item.id)}
            >
              <Text style={styles.typeEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  type === item.id && styles.typeLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name Input */}
        <Text style={styles.label}>スポット名 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例: 梅田駅前 喫煙所"
          placeholderTextColor="#999"
        />

        {/* Location */}
        <Text style={styles.label}>位置情報 *</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.locationButtonIcon}>📍</Text>
              <Text style={styles.locationButtonText}>
                現在地を取得
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.coordRow}>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>緯度</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="34.702485"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Address */}
        <Text style={styles.label}>住所</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="大阪市北区梅田1-1-1"
          placeholderTextColor="#999"
        />

        {/* Description */}
        <Text style={styles.label}>説明・メモ</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="営業時間や注意点など..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>スポットを登録</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#E8F4FD',
    borderColor: '#4A90D9',
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90D9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  locationButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  coordLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
