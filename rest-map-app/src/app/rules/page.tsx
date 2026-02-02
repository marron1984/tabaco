import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-600 text-lg">
            ← 戻る
          </Link>
          <h1 className="font-semibold text-gray-900">利用規約・免責事項</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* About */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">関西MAPについて</h2>
          <p className="text-gray-700 leading-relaxed">
            関西MAP（以下「本サービス」）は、大阪を中心とした関西エリアで「無料で使えるトイレ」と「喫煙可能な場所」の情報を共有するためのWebアプリケーションです。
            ユーザー同士の情報共有により、地域の利便性向上を目指しています。
          </p>
        </section>

        {/* Smoking Information */}
        <section className="bg-orange-50 rounded-xl p-4">
          <h2 className="text-lg font-bold text-orange-900 mb-3">
            🚬 喫煙情報の取り扱いについて
          </h2>
          <div className="text-orange-800 space-y-3 text-sm">
            <p>
              本サービスで共有される喫煙情報は、<strong>法律・条例で許可された場所</strong>および<strong>施設が喫煙を認めている場所</strong>に限定されます。
            </p>
            <p className="font-bold text-red-700">以下の投稿は禁止されています：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>路上喫煙禁止区域での喫煙場所</li>
              <li>私有地への無断侵入を伴う場所</li>
              <li>禁煙施設内での喫煙</li>
              <li>その他、法律・条例・施設ルールに違反する喫煙行為を助長する情報</li>
            </ul>
            <p>
              違反が疑われる投稿は、通報機能により削除対象となります。
              投稿者は、情報の正確性と適法性に責任を持つものとします。
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">免責事項</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>
              1. 本サービスで提供される情報は、ユーザーによる投稿に基づいており、運営者はその正確性、完全性、最新性を保証しません。
            </p>
            <p>
              2. 掲載された施設・場所は、営業時間の変更、閉鎖、ルール変更等により、実際の状況と異なる場合があります。ご利用前に必ず現地でご確認ください。
            </p>
            <p>
              3. 本サービスの利用により生じたいかなる損害についても、運営者は責任を負いません。
            </p>
            <p>
              4. 本サービスは予告なく変更、中断、終了する場合があります。
            </p>
            <p>
              5. ユーザーは、本規約および各施設・地域のルール・法律を遵守する責任があります。
            </p>
          </div>
        </section>

        {/* User Responsibility */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">投稿者の責任</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>投稿者は以下の事項を遵守するものとします：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>虚偽の情報を投稿しないこと</li>
              <li>他者を誹謗中傷する内容を投稿しないこと</li>
              <li>違法行為を助長する情報を投稿しないこと</li>
              <li>プライバシーを侵害する情報を投稿しないこと</li>
              <li>施設の許可なく、施設内部の詳細な情報を投稿しないこと</li>
            </ul>
          </div>
        </section>

        {/* Auto-verification */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">情報の自動更新確認</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            投稿された情報は、一定期間経過後に「要確認」ステータスとなり、新しい口コミによる確認が求められます。
            これにより、情報の鮮度を維持し、閉鎖済みや変更された施設の情報が放置されることを防ぎます。
          </p>
        </section>

        {/* Open Data */}
        <section className="bg-blue-50 rounded-xl p-4">
          <h2 className="text-lg font-bold text-blue-900 mb-3">
            📊 オープンデータについて
          </h2>
          <div className="text-blue-800 space-y-3 text-sm">
            <p>
              本サービスでは、以下のオープンデータを利用しています：
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>大阪府 公衆トイレ一覧（Creative Commons Attribution 4.0）</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              ※ オープンデータに基づく情報についても、実際の状況と異なる場合があります。
            </p>
          </div>
        </section>

        {/* Report */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">通報について</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            不適切な情報、古い情報、違法な情報を発見した場合は、各スポット・口コミの「通報」ボタンからご報告ください。
            運営者が確認の上、適切な対応を行います。
          </p>
        </section>

        {/* Contact */}
        <section className="bg-gray-100 rounded-xl p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">お問い合わせ</h2>
          <p className="text-gray-600 text-sm">
            本サービスに関するお問い合わせは、通報機能をご利用いただくか、以下までご連絡ください。
          </p>
          <p className="text-gray-700 text-sm mt-2">
            ※ 運営元情報は準備中です
          </p>
        </section>

        {/* Last Updated */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          最終更新: 2025年1月
        </div>
      </main>
    </div>
  );
}
