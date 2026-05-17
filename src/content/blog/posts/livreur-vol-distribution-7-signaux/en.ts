import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Is your driver stealing? 7 clear warning signs (and the fix)',
  excerpt:
    'Every distributor wonders if their drivers are honest. Here are 7 concrete red flags that expose theft on a route, and how to stop it in two weeks.',
  tags: [
    'driver theft prevention',
    'GPS fleet tracking',
    'delivery management',
    'cash collection control',
    'CashVan',
  ],
  content: `
<p class="lead">You load a truck with 420 cases. That evening, the driver returns with <strong>about $25 less than expected</strong> and a vague explanation. It is not the first time. Before you accuse anyone, here are <span class="highlight-blue">7 concrete signals</span> that reveal route-level theft — and how to shut it down without drama.</p>

<h2>1. The cash variance that comes back every Friday</h2>
<p>One-off shortages happen: a coin dropped, a customer short-paying. But when the gap is <strong>recurring, always in the same direction</strong> (never in your favor) and always on the same day of the week, it is no longer chance.</p>

<div class="info-box">
  <div class="box-title">💡 The simple test</div>
  <p>Pull cash variances per driver over 30 days. Sort them. If one driver concentrates <strong>more than 60% of negative variances</strong> while doing only 20% of routes, you have your answer.</p>
</div>

<h2>2. Returns that never actually happened</h2>
<p>A classic: the driver claims the customer refused delivery. He "returns" the goods to the depot. Except that return is never properly logged, or it is logged later in the week, in different quantities.</p>
<p>Ask your warehouse keeper: every return must be weighed, counted, and signed <strong>the same day</strong>. If a driver has 3–4 returns per week while the average is 0.5, dig deeper.</p>

<h2>3. Cash-only customers you can never reach</h2>
<p>The scenario: the driver collects cash, tells you Mr. Bell paid, but when you call Mr. Bell three weeks later for an unrelated reason, he is shocked — he paid by check, or he never received the order at all.</p>

<div class="warning-box">
  <div class="box-title">⚠️ The absolute red flag</div>
  <p>A driver who <strong>refuses</strong> to let you call his customers "because it will annoy them" is hiding something. Call them anyway. Politely. Directly.</p>
</div>

<h2>4. Routes that run 3 hours too long</h2>
<p>A route through three suburbs and back to the depot should take 4.5 hours. Your driver returns at 7pm after leaving at 8am. Where did the missing 5 hours go?</p>
<p>Without GPS, you have <strong>no way</strong> to know. With real-time tracking, you see:</p>
<ul class="check-list">
  <li>Unjustified long stops (a 90-minute coffee break?)</li>
  <li>Detours to addresses that are not on the route</li>
  <li>"Dead" zones where the truck sits idle with no customer to visit</li>
</ul>

<h2>5. Stock that "evaporates" between loading and return</h2>
<p>Morning load is logged: 420 cases. Evening return: 12 cases (unsold). Declared sales: 405 cases. <strong>3 cases are missing.</strong></p>
<p>One case "disappearing" can be a mistake. Three cases per week is 12 per month, 144 per year. At about $25 per case, you just lost <strong>$3,600</strong>. From a single driver.</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">144</div>
    <div class="stat-label">Cases lost per year on 1 driver</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">$3.6K</div>
    <div class="stat-label">Net annual loss</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">3×</div>
    <div class="stat-label">If 3 drivers are doing the same</div>
  </div>
</div>

<h2>6. "Negotiated" prices that should not exist</h2>
<p>A driver who sells a product priced at $1.00 for $0.95 and pockets the difference, or who applies a "special discount" on 20 cases and collects the discount in cash on the side. The customer pays the normal price, the driver takes $1.00 × 20 = $20 in his pocket.</p>
<p>Only <strong>locked product pricing inside the app</strong> prevents this. If the driver cannot enter a price lower than the office-set price, he cannot steal on price.</p>

<h2>7. No proof of delivery, ever</h2>
<p>No signed delivery note. No receipt. No photo. "He's an old customer, he trusts me." When a driver racks up deliveries <strong>without proof</strong>, you have no recourse the day the customer disputes the order.</p>

<div class="purple-box">
  <div class="box-title">📐 The golden rule</div>
  <p>No delivery leaves your system without: <strong>a customer signature OR a photo of the signed slip OR a geotagged delivery point</strong>. All three together if you can.</p>
</div>

<h2>The fix: close every door at the same time</h2>

<p>Tracking each signal manually is exhausting. The real remedy is to make theft <strong>technically impossible</strong>. That is exactly what TrackSera does:</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">📍</div>
    <h4>Real-time GPS</h4>
    <p>You see where every truck is, its stops, its detours</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#dcfce7;color:#166534">📦</div>
    <h4>Locked load</h4>
    <p>All truck stock lives in the app. Impossible to "lose" a case without a trail</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">💰</div>
    <h4>Locked prices</h4>
    <p>The driver can never enter a price lower than the one set at the office</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#f3e8ff;color:#6b21a8">✍️</div>
    <h4>Signature + photo</h4>
    <p>Every delivery is signed on-screen and geolocated at the moment of drop-off</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">📊</div>
    <h4>Variance report</h4>
    <p>The dashboard automatically lists load ↔ return variances per driver</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#e0f2fe;color:#075985">🧾</div>
    <h4>Traced collections</h4>
    <p>Every payment is timestamped, tied to a customer, and closed off in the evening cash-up</p>
  </div>
</div>

<h2>What our customers see within 2 weeks</h2>

<ul class="check-list">
  <li>Cash variances <strong>drop by 70–95%</strong> from the first week (deterrent effect)</li>
  <li>Routes run 20–40% faster (no more "coffee stops")</li>
  <li>Honest drivers are thrilled: they are finally protected from unfair accusations</li>
  <li>Dishonest drivers resign on their own — that is the clearest signal of all</li>
</ul>

<div class="success-box">
  <div class="box-title">✅ The bottom line</div>
  <p>You are not trying to punish your drivers. You are trying to know what actually happens in the field. With the right tools, you no longer guess — you know. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Start your free 14-day trial →</a></p>
</div>

<hr class="divider"/>

<p><em>Also read: <a href="/blog/cashvan-vente-mobile-distribution-algerie">The CashVan guide — mobile selling for distributors</a> and <a href="/blog/logiciel-gestion-distribution-algerie-2026">How to choose distribution software in 2026</a>.</em></p>
`,
};

export default data;
