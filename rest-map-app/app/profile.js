'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../constants/theme';

// Menu Item Component
function MenuItem({ icon, title, subtitle, onPress, danger, showArrow = true }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );
}

// Stat Card Component
function StatCard({ value, label, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {isMember ? (user?.email?.charAt(0).toUpperCase() || 'M') : 'G'}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isMember ? 'Member' : 'Guest'}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>
          {isMember ? user?.email : 'ゲストユーザー'}
        </Text>

        {/* Stats for Members */}
        {isMember && (
          <View style={styles.statsRow}>
            <StatCard
              value={loading ? '-' : stats.spots}
              label="スポット"
              icon="📍"
            />
            <StatCard
              value={loading ? '-' : stats.reviews}
              label="レビュー"
              icon="⭐"
            />
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          {/* Guest Promotion */}
          {isGuest && (
            <TouchableOpacity
              style={styles.promoCard}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <View style={styles.promoIconContainer}>
                <Text style={styles.promoIcon}>🎉</Text>
              </View>
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>メンバーになりませんか？</Text>
                <Text style={styles.promoText}>
                  ユーザー投稿のスポットを閲覧、{'\n'}スポット追加やレビュー投稿ができます
                </Text>
              </View>
              <Text style={styles.promoArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Menu Sections */}
          {isMember && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>アクティビティ</Text>
              <MenuItem
                icon="📍"
                title="投稿したスポット"
                subtitle={`${stats.spots} 件`}
                onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
              />
              <MenuItem
                icon="⭐"
                title="レビュー履歴"
                subtitle={`${stats.reviews} 件`}
                onPress={() => Alert.alert('準備中', 'この機能は準備中です')}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>設定</Text>
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
                showArrow={false}
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
            <Text style={styles.appLogo}>🗺️</Text>
            <Text style={styles.appName}>RestMap</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: COLORS.textLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Content Card
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  contentCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    minHeight: 600,
  },

  // Promo Card
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  promoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  promoIcon: {
    fontSize: 24,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  promoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  promoArrow: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  menuTitleDanger: {
    color: COLORS.error,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '300',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.md,
  },
  appLogo: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
