# React Native + Firebase: 認証状態による情報出し分け & 口コミ投稿機能

このドキュメントは、**認証状態によるアクセス制御**と**口コミ投稿機能**を実装するための設計・コード例をまとめたものです。

## データモデル (Firestore)

```ts
// Spots Collection
type Spot = {
  id: string;
  location: FirebaseFirestoreTypes.GeoPoint;
  type: 'public_smoking' | 'public_toilet' | 'user_shared_spot';
  isOfficial: boolean;
  averageRating?: number;
};

// Spots/{spotId}/Reviews Sub-collection
type Review = {
  userId: string;
  comment: string;
  tags: string[]; // ['clean', 'usable', 'smoking_allowed']
  timestamp: FirebaseFirestoreTypes.Timestamp;
};
```

---

## 1) AuthContext / Hook

アプリ全体でログイン状態を管理します。`user` が `null` の場合はゲスト扱いです。

```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';

type AuthContextValue = {
  user: import('@react-native-firebase/auth').FirebaseAuthTypes.User | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  initializing: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 2) MapScreen (Filtering Logic)

`user` の有無によってクエリを切り替えます。  
ゲストは `isOfficial == true` のみ取得し、ログインユーザーは全件取得します。

```tsx
// src/screens/MapScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

type Spot = {
  id: string;
  location: FirebaseFirestoreTypes.GeoPoint;
  type: string;
  isOfficial: boolean;
  averageRating?: number;
};

export const MapScreen: React.FC = () => {
  const { user, initializing } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initializing) return;

    const baseQuery = firestore().collection('spots');
    const query = user ? baseQuery : baseQuery.where('isOfficial', '==', true);

    const unsubscribe = query.onSnapshot((snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Spot, 'id'>),
      }));
      setSpots(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, initializing]);

  if (loading) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  // NOTE: ここで Map のピン表示を行う
  return <View>{/* Map component */}</View>;
};
```

---

## 3) SpotDetailScreen

ログイン状態に応じてUIを切り替えます。  
ゲストには「ログインして口コミを見る」ボタン、ログイン済みには投稿フォームと口コミ一覧を表示。

```tsx
// src/screens/SpotDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

type Review = {
  id: string;
  userId: string;
  comment: string;
  tags: string[];
  timestamp: FirebaseFirestoreTypes.Timestamp;
};

export const SpotDetailScreen: React.FC<{ spotId: string }> = ({ spotId }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('spots')
      .doc(spotId)
      .collection('reviews')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Review, 'id'>),
        }));
        setReviews(items);
      });

    return unsubscribe;
  }, [spotId, user]);

  const submitReview = async () => {
    if (!user || comment.trim().length === 0) return;

    await firestore()
      .collection('spots')
      .doc(spotId)
      .collection('reviews')
      .add({
        userId: user.uid,
        comment: comment.trim(),
        tags,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    setComment('');
    setTags([]);
  };

  return (
    <View>
      <Text>Spot Detail</Text>

      {!user ? (
        <Button title="ログインして口コミを見る" onPress={() => { /* navigate to login */ }} />
      ) : (
        <>
          <Text>口コミを投稿</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="ここ綺麗でした、など"
          />
          {/* tags UI 例 */}
          <Button title="投稿する" onPress={submitReview} />

          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                <Text>{item.comment}</Text>
                <Text>{item.tags.join(', ')}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};
```

---

## Firestore Security Rules (概念コード)

ゲストは `isOfficial == true` の読み取りのみ許可、  
ログインユーザーは全読み取り & 書き込み可。

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spots/{spotId} {
      allow read: if resource.data.isOfficial == true || request.auth != null;
      allow write: if request.auth != null;

      match /reviews/{reviewId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null
          && request.resource.data.userId == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}
```

---

## 補足

- ゲストの「口コミモザイク表示」などは、UIで `user == null` のときに `BlurView` やロックアイコンを出すだけで実現可能です。
- `tags` は string 配列で扱い、チップUIやトグルで選択できるようにするとUXが良くなります。
