import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Osaka demo data to insert
const OSAKA_DEMO_SPOTS = [
  {
    name: 'ヨドバシカメラ梅田 喫煙所',
    type: 'smoking',
    lat: 34.704067,
    lng: 135.496244,
    address: '大阪市北区大深町1-1 ヨドバシカメラ付近',
    description: '大阪駅北側、ヨドバシカメラ近くの公式喫煙所。屋根付きで雨の日も安心。',
    isPublic: true,
    isOfficial: true,
  },
  {
    name: '大阪駅前第3ビル 公衆トイレ',
    type: 'toilet',
    lat: 34.700909,
    lng: 135.498291,
    address: '大阪市北区梅田1-1-3 大阪駅前第3ビルB2F',
    description: '地下街直結の公衆トイレ。比較的綺麗で空いていることが多い。',
    isPublic: true,
    isOfficial: true,
  },
  {
    name: '難波 秘密の喫煙所',
    type: 'smoking',
    lat: 34.665487,
    lng: 135.501038,
    address: '大阪市中央区難波5丁目付近',
    description: '難波駅から徒歩3分。地元民しか知らない穴場スポット。',
    isPublic: false,
    isOfficial: false,
  },
  {
    name: 'アメ村カフェ＆スモーク',
    type: 'cafe',
    lat: 34.672314,
    lng: 135.498556,
    address: '大阪市中央区西心斎橋2丁目',
    description: 'アメリカ村の隠れ家カフェ。喫煙可能席あり、コーヒーも美味しい。',
    isPublic: false,
    isOfficial: false,
  },
  {
    name: '梅田地下街 トイレ (ホワイティうめだ)',
    type: 'toilet',
    lat: 34.703892,
    lng: 135.500124,
    address: '大阪市北区小松原町 ホワイティうめだ内',
    description: 'ホワイティうめだ内の綺麗なトイレ。ベビールームも完備。',
    isPublic: true,
    isOfficial: true,
  },
  {
    name: '心斎橋 隠れ喫煙スポット',
    type: 'smoking',
    lat: 34.675123,
    lng: 135.501234,
    address: '大阪市中央区心斎橋筋付近',
    description: '心斎橋筋商店街から少し入った路地にある喫煙所。人が少なくて快適。',
    isPublic: false,
    isOfficial: false,
  },
];

export default function DebugScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addOsakaDemoData = async () => {
    setLoading(true);
    setResults([]);
    const newResults = [];

    for (const spot of OSAKA_DEMO_SPOTS) {
      try {
        const collectionName = spot.isPublic ? 'publicSpots' : 'userSpots';
        const docData = {
          ...spot,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, collectionName), docData);
        newResults.push({ success: true, name: spot.name, id: docRef.id });
      } catch (error) {
        newResults.push({ success: false, name: spot.name, error: error.message });
      }
    }

    setResults(newResults);
    setLoading(false);

    const successCount = newResults.filter(r => r.success).length;
    Alert.alert(
      'Complete',
      `${successCount}/${OSAKA_DEMO_SPOTS.length} spots added successfully!`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Tools</Text>
        <Text style={styles.subtitle}>開発・テスト用の機能</Text>
      </View>

      {/* Demo Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>大阪デモデータ投入</Text>
        <Text style={styles.description}>
          梅田・難波エリアのテスト用スポットデータをFirestoreに追加します。
          {'\n'}(合計 {OSAKA_DEMO_SPOTS.length} 件)
        </Text>

        <View style={styles.dataPreview}>
          <Text style={styles.previewTitle}>投入データ:</Text>
          {OSAKA_DEMO_SPOTS.map((spot, index) => (
            <View key={index} style={styles.previewItem}>
              <Text style={styles.previewEmoji}>
                {spot.type === 'smoking' ? '🚬' : spot.type === 'toilet' ? '🚻' : '☕'}
              </Text>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{spot.name}</Text>
                <Text style={styles.previewType}>
                  {spot.type} / {spot.isPublic ? 'Public' : 'User Spot'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={addOsakaDemoData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>大阪のデモデータを追加</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>実行結果:</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={result.success ? styles.resultSuccess : styles.resultError}>
                  {result.success ? '✓' : '✗'} {result.name}
                </Text>
                {result.error && (
                  <Text style={styles.resultErrorMsg}>{result.error}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← マップに戻る</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 24,
    backgroundColor: '#4A90D9',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  dataPreview: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewTitle: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8 },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  previewEmoji: { fontSize: 20, marginRight: 10 },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 14, fontWeight: '500', color: '#333' },
  previewType: { fontSize: 11, color: '#999' },
  button: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  results: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  resultsTitle: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8 },
  resultItem: { paddingVertical: 4 },
  resultSuccess: { fontSize: 14, color: '#4CAF50' },
  resultError: { fontSize: 14, color: '#F44336' },
  resultErrorMsg: { fontSize: 11, color: '#999', marginLeft: 20 },
  backButton: {
    margin: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: { color: '#666', fontSize: 14, fontWeight: '500' },
  bottomPadding: { height: 40 },
});
