# データインポート

## 大阪市公衆トイレデータ

### ソース
- 大阪市 MapNavi（大阪市地図情報）
- URL: https://www.mapnavi.city.osaka.lg.jp/
- 環境局所管トイレ一覧（PDF）

### CSV形式

`osaka_toilets.csv` は以下の形式で作成してください：

```csv
source_id,name,address,category,note
1,天六公衆トイレ,大阪市北区天神橋6-4-20,public_toilet,男女/身障者用あり
2,梅田駅前公衆トイレ,大阪市北区梅田1-1,public_toilet,24時間利用可
```

| カラム | 必須 | 説明 |
|--------|------|------|
| source_id | ○ | 一意のID（連番など） |
| name | △ | トイレ名（空の場合は自動生成） |
| address | ○ | 所在地（ジオコーディングに使用） |
| category | - | カテゴリ（public_toilet など） |
| note | - | 備考（設備情報など） |

### インポート実行

1. 環境変数を設定
```bash
export NEXT_PUBLIC_SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. ドライラン（実際には書き込まない）
```bash
npm run import:osaka:dry
```

3. 本番インポート
```bash
npm run import:osaka
```

### 出力ファイル

- `geocode_cache.json` - ジオコーディング結果のキャッシュ（再実行時に再利用）
- `import_failed.json` - インポートに失敗した行のリスト

### 注意事項

- Nominatim（OpenStreetMap）のジオコーディングAPIを使用
- レート制限のため、1リクエストあたり1秒以上の間隔を空けます
- 一度ジオコーディングした住所はキャッシュされ、再実行時には再度APIを叩きません
- User-Agentを明示して利用規約を遵守しています
