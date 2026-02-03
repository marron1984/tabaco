/**
 * 大阪市公衆トイレCSVをジオコーディングしてSupabaseにインポートするスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/geocode_and_import_osaka_csv.ts
 *
 * 環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase Service Role Key (for upsert)
 *
 * 入力:
 *   data/osaka_toilets.csv
 *
 * 出力:
 *   data/geocode_cache.json - ジオコーディング結果のキャッシュ
 *   data/import_failed.json - インポート失敗した行のリスト
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  csvPath: path.join(__dirname, '../data/osaka_toilets.csv'),
  cachePath: path.join(__dirname, '../data/geocode_cache.json'),
  failedPath: path.join(__dirname, '../data/import_failed.json'),
  geocodeDelay: 1100, // 1.1 seconds between requests (Nominatim rate limit)
  sourceName: 'osaka_city_pdf',
  sourceUrl: 'https://www.mapnavi.city.osaka.lg.jp/osakacity-sp/MapPage?dtp=1&mps=50000&mpx=135.50778404401&mpy=34.683673323966&gprj=3&mtl=1011&mcl=1011,101101,101101,101101;1011,101102,101102,101102&flgInit=1&vpc=0',
  userAgent: 'KansaiMap/1.0 (https://github.com/marron1984/tabaco)',
};

// Types
interface CsvRow {
  source_id: string;
  name: string;
  address: string;
  category: string;
  note: string;
}

interface GeocodeCacheEntry {
  lat: number;
  lng: number;
  geocodedAt: string;
}

interface GeocodeCache {
  [address: string]: GeocodeCacheEntry;
}

interface FailedRow {
  source_id: string;
  name: string;
  address: string;
  reason: string;
}

// Load or create geocode cache
function loadGeocodeCache(): GeocodeCache {
  try {
    if (fs.existsSync(CONFIG.cachePath)) {
      const data = fs.readFileSync(CONFIG.cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load geocode cache, starting fresh');
  }
  return {};
}

// Save geocode cache
function saveGeocodeCache(cache: GeocodeCache): void {
  fs.writeFileSync(CONFIG.cachePath, JSON.stringify(cache, null, 2), 'utf-8');
}

// Parse CSV (simple implementation)
function parseCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row as unknown as CsvRow);
  }
  return rows;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Geocode using Nominatim
async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${address} 大阪市`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=jp`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    return null;
  }
}

// Main geocode function with caching
async function geocode(
  address: string,
  cache: GeocodeCache
): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (cache[address]) {
    console.log(`  [CACHE HIT] ${address}`);
    return { lat: cache[address].lat, lng: cache[address].lng };
  }

  // Geocode with Nominatim
  console.log(`  [GEOCODING] ${address}`);
  const result = await geocodeWithNominatim(address);

  if (result) {
    // Save to cache
    cache[address] = {
      lat: result.lat,
      lng: result.lng,
      geocodedAt: new Date().toISOString(),
    };
    saveGeocodeCache(cache);
  }

  return result;
}

// Generate description (must be at least 20 characters)
function generateDescription(row: CsvRow): string {
  const parts: string[] = [];

  parts.push(`${row.address}付近の公衆トイレ（自動登録）。`);

  if (row.note) {
    parts.push(`設備: ${row.note}。`);
  }

  parts.push('詳細は現地表示または口コミで更新予定。');

  const description = parts.join(' ');

  // Ensure minimum 20 characters
  if (description.length < 20) {
    return description + '情報提供をお待ちしています。';
  }

  return description;
}

// Main import function
async function main() {
  console.log('=== 大阪市公衆トイレ インポートスクリプト ===\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nYou can run in dry-run mode without Supabase by adding --dry-run flag');

    if (!process.argv.includes('--dry-run')) {
      process.exit(1);
    }
  }

  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('*** DRY RUN MODE - No data will be written to Supabase ***\n');
  }

  // Initialize Supabase client (only if not dry run)
  let supabase: ReturnType<typeof createClient> | null = null;
  if (!isDryRun && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // Load CSV
  console.log(`Reading CSV: ${CONFIG.csvPath}`);
  if (!fs.existsSync(CONFIG.csvPath)) {
    console.error(`Error: CSV file not found: ${CONFIG.csvPath}`);
    process.exit(1);
  }
  const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf-8');
  const rows = parseCsv(csvContent);
  console.log(`Found ${rows.length} rows\n`);

  // Load geocode cache
  const cache = loadGeocodeCache();
  console.log(`Loaded geocode cache with ${Object.keys(cache).length} entries\n`);

  // Process each row
  const failed: FailedRow[] = [];
  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`[${i + 1}/${rows.length}] Processing: ${row.name || row.source_id}`);

    // Geocode
    const location = await geocode(row.address, cache);

    if (!location) {
      console.log(`  [FAILED] Could not geocode address`);
      failed.push({
        source_id: row.source_id,
        name: row.name,
        address: row.address,
        reason: 'Geocoding failed',
      });
      continue;
    }

    console.log(`  [OK] Location: ${location.lat}, ${location.lng}`);

    // Prepare spot data
    const spotData = {
      type: 'toilet' as const,
      title: row.name || '公衆トイレ（自動登録）',
      description: generateDescription(row),
      evidence_hint: row.note || null,
      lat: location.lat,
      lng: location.lng,
      region_tag: 'kansai',
      status: 'active' as const,
      anonymous_id: 'system_import',
      toilet_is_free: true,
      toilet_open_24h: row.note?.includes('24時間') || null,
      toilet_barrier_free: row.note?.includes('バリアフリー') || row.note?.includes('身障者') || null,
      source_name: CONFIG.sourceName,
      source_id: row.source_id,
      source_url: CONFIG.sourceUrl,
    };

    if (isDryRun) {
      console.log(`  [DRY RUN] Would insert:`, JSON.stringify(spotData, null, 2));
      successCount++;
    } else if (supabase) {
      // Upsert to Supabase
      const { error } = await supabase
        .from('spots')
        .upsert(spotData, {
          onConflict: 'source_name,source_id',
        });

      if (error) {
        console.log(`  [DB ERROR] ${error.message}`);
        failed.push({
          source_id: row.source_id,
          name: row.name,
          address: row.address,
          reason: `DB error: ${error.message}`,
        });
      } else {
        console.log(`  [INSERTED]`);
        successCount++;
      }
    }

    // Rate limiting (only if we actually made a geocoding request)
    if (!cache[row.address]) {
      await sleep(CONFIG.geocodeDelay);
    }
  }

  // Save failed rows
  if (failed.length > 0) {
    fs.writeFileSync(CONFIG.failedPath, JSON.stringify(failed, null, 2), 'utf-8');
    console.log(`\nFailed rows saved to: ${CONFIG.failedPath}`);
  }

  // Summary
  console.log('\n=== Import Summary ===');
  console.log(`Total rows: ${rows.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Skipped: ${skipCount}`);

  if (isDryRun) {
    console.log('\n*** This was a dry run. No data was written to Supabase. ***');
  }
}

// Run
main().catch(console.error);
