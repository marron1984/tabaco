import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isMember, isGuest, signOut } = useAuth();
  const [stats, setStats] = useState({ spots: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!isMember || !user?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Count user's submitted spots
      let spotCount = 0;
      let reviewCount = 0;

      try {
        const spotsQuery = query(
          collection(db, 'userSpots'),
          where('submittedBy', '==', user.uid)
        );
        const spotsSnapshot = await getDocs(spotsQuery);
        spotCount = spotsSnapshot.size;
      } catch (e) {
        console.log('Could not fetch spots count');
      }

      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', user.uid)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        reviewCount = reviewsSnapshot.size;
      } catch (e) {
        console.log('Could not fetch reviews count');
      }

      setStats({ spots: spotCount, reviews: reviewCount });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {isMember ? (user?.email?.charAt(0).toUpperCase() || 'M') : 'G'}
          </Text>
        </View>
        <Text style={styles.userName}>
          {isMember ? user?.email : 'ゲストユーザー'}
        </Text>
        <Text style={styles.userStatus}>
          {isMember ? 'メンバー' : 'ゲストとしてブラウズ中'}
        </Text>

        {/* Stats for Members */}
        {isMember && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {loading ? '-' : stats.spots}
              </Text>
              <Text style={styles.statLabel}>登録スポット</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {loading ? '-' : stats.reviews}
              </Text>
              <Text style={styles.statLabel}>レビュー</Text>
            </View>
          </View>
        )}
      </View>

      {/* Guest Promotion */}
      {isGuest && (
        <TouchableOpacity
          style={styles.promoCard}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.promoIcon}>🎉</Text>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>メンバーになりませんか？</Text>
            <Text style={styles.promoText}>
              ログインすると、ユーザー投稿のスポットを閲覧したり、
              自分でスポットを追加したり、レビューを書けるようになります！
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Menu Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>設定</Text>

        {isMember && (
          <>
            <MenuItem
              icon="📍"
              title="投稿したスポット"
              subtitle={`${stats.spots} 件のスポット`}
              onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
            />
            <MenuItem
              icon="⭐"
              title="レビュー履歴"
              subtitle={`${stats.reviews} 件のレビュー`}
              onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
            />
          </>
        )}

        <MenuItem
          icon="🔔"
          title="通知設定"
          subtitle="プッシュ通知のON/OFF"
          onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
        />

        <MenuItem
          icon="🌙"
          title="表示設定"
          subtitle="ダークモード、言語など"
          onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>サポート</Text>

        <MenuItem
          icon="❓"
          title="ヘルプ"
          subtitle="使い方ガイド"
          onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
        />

        <MenuItem
          icon="📧"
          title="お問い合わせ"
          subtitle="フィードバックを送る"
          onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
        />

        <MenuItem
          icon="📋"
          title="利用規約"
          onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
        />

        <MenuItem
          icon="🔒"
          title="プライバシーポリシー"
          onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
        />
      </View>

      {/* Auth Actions */}
      <View style={styles.section}>
        {isMember ? (
          <MenuItem
            icon="🚪"
            title="ログアウト"
            danger
            onPress={handleSignOut}
          />
        ) : (
          <MenuItem
            icon="🔑"
            title="ログイン / 新規登録"
            onPress={() => router.push('/login')}
          />
        )}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>RestMap</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2024 RestMap</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90D9',
    padding: 24,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginTop: 20,
    padding: 16,
    paddingHorizontal: 32,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  promoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  menuTitleDanger: {
    color: '#FF3B30',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appVersion: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
  },
});
