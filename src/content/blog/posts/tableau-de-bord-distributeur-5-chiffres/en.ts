import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Distributor dashboard: 5 numbers to watch every morning',
  excerpt: 'Running a distribution business without a dashboard is like driving a truck blindfolded. These 5 numbers reveal the health of your operation in 60 seconds.',
  tags: ['Distribution dashboard', 'Sales KPIs', 'Daily reporting', 'Business intelligence', 'Cash flow'],
  content: `
<p class="lead">Every morning, you have <strong>60 seconds</strong> between your first coffee and the first call from the warehouse. Those 60 seconds should be enough to know whether yesterday was a good or bad day, and where to look first today. Here are <span class="highlight-blue">the 5 numbers</span> that give you that view — and why everything else barely matters.</p>

<h2>1. Yesterday's revenue vs 7-day average</h2>

<p>Yesterday's raw number tells you nothing on its own. What matters is: <strong>was yesterday above or below trend?</strong></p>

<div class="info-box">
  <div class="box-title">💡 The read that counts</div>
  <p>Display yesterday in dollars AND as a % vs the rolling 7-day average. A day at -23% isn't dramatic on its own (public holiday). A day at -23% following three other days at -15% is a <strong>red flag</strong>.</p>
</div>

<p>Concretely, on your morning dashboard:</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">$12,475</div>
    <div class="stat-label">Revenue yesterday</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">+12%</div>
    <div class="stat-label">vs 7-day average</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#3b82f6">83</div>
    <div class="stat-label">Transactions</div>
  </div>
</div>

<p>Three data points, two seconds to read. You already know whether you can breathe or whether you need to dig deeper.</p>

<h2>2. Cash collected vs cash expected</h2>

<p>Invoiced revenue doesn't pay your suppliers. What pays your suppliers is <strong>cash that actually came in</strong>. And in 90% of distribution businesses, there's a daily gap between the two:</p>

<ul class="check-list">
  <li>Credit sales (30-day payment terms)</li>
  <li>Customers who pay only part of the bill</li>
  <li>Cheques not yet deposited</li>
  <li>Unexplained cash drawer variances</li>
</ul>

<div class="warning-box">
  <div class="box-title">⚠️ The ratio that kills you</div>
  <p>If your <strong>Cash collected ÷ Cash expected</strong> ratio drops below 85% for 3 days in a row, you have a collection problem. Not tomorrow. Right now.</p>
</div>

<h2>3. Stock at risk: SKUs about to run out</h2>

<p>This is the number owners forget the most, and it's the one that hurts the most. You sell a product well. Stock drops. Nobody orders the replenishment. You discover the stockout <strong>the day a big customer places an order</strong> and tells you "cancel, I'll go to your competitor."</p>

<p>Your dashboard should tell you, in a single number:</p>

<div class="purple-box">
  <div class="box-title">📦 Example</div>
  <p><strong>17 SKUs</strong> will hit their critical threshold within the next 7 days at the current consumption rate. Click to view the list, compare against supplier lead times, trigger an order if needed.</p>
</div>

<p>That's it. No need for a 40-column Excel report. One number, one list, one action.</p>

<h2>4. Late or failed deliveries</h2>

<p>A delivery that doesn't reach its destination is a potentially lost customer. A late delivery without notifying the customer is a real lost customer. Your morning should start with this question: <strong>"Were there any routes yesterday that didn't close out?"</strong></p>

<p>The dashboard should aggregate:</p>

<ul class="check-list">
  <li>Number of <strong>successful</strong> deliveries (signature + customer satisfied)</li>
  <li>Number of <strong>failed</strong> deliveries (customer absent, refusal, wrong address)</li>
  <li>Number of <strong>returned-to-depot</strong> deliveries (to re-deliver today)</li>
  <li>The driver involved in each failure — to spot patterns</li>
</ul>

<h2>5. Today's margin (not just revenue)</h2>

<p>Selling at a loss happens to everyone. The tragedy is selling at a loss <strong>without knowing it</strong>. An eager driver who applies the "loyal-customer 15% discount" on products that already run an 8% margin is a sales day that costs you money.</p>

<p>Your dashboard should display:</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#3b82f6">$12,475</div>
    <div class="stat-label">Revenue</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#f59e0b">$9,832</div>
    <div class="stat-label">Cost of goods</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">21.2%</div>
    <div class="stat-label">Gross margin</div>
  </div>
</div>

<p>If today's gross margin is <strong>5 points below</strong> your average, something is off. Unauthorized discount, pricing error, lost product counted as a sale… The 5 numbers tell you <strong>where to look</strong>.</p>

<h2>What you should NOT put on your morning dashboard</h2>

<p>The temptation is to display everything. That's the best way to see nothing. Here's what doesn't deserve the first screen:</p>

<ul class="check-list">
  <li>Year-to-date revenue (review once a month, not every morning)</li>
  <li>Top products (review weekly to plan purchases)</li>
  <li>The full customer list (useless when you wake up)</li>
  <li>Decorative 3D charts (they serve nothing)</li>
  <li>"KPIs" you don't understand or never use</li>
</ul>

<div class="info-box">
  <div class="box-title">💡 The golden rule</div>
  <p>If you make <strong>no decision</strong> based on a number, it doesn't belong on your morning dashboard. Move it to a "weekly report" or "monthly analysis" screen.</p>
</div>

<h2>How TrackSera organizes this</h2>

<p>Our home dashboard is intentionally minimal: <strong>5 blocks, a single screen, no scroll</strong>. Everything else lives in detailed reports, one click away when you need them — not before.</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">📈</div>
    <h4>Day revenue vs 7-day</h4>
    <p>With % variation and transaction count</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#dcfce7;color:#166534">💰</div>
    <h4>Today's cash</h4>
    <p>Collected vs expected, by payment method</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">📦</div>
    <h4>Critical stock</h4>
    <p>SKUs in alert based on real consumption</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#f3e8ff;color:#6b21a8">🚚</div>
    <h4>Deliveries</h4>
    <p>Successful / failed / in progress per driver</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#e0f2fe;color:#075985">📊</div>
    <h4>Today's margin</h4>
    <p>Gross margin with alert on abnormal swings</p>
  </div>
</div>

<div class="success-box">
  <div class="box-title">✅ 60 seconds is enough</div>
  <p>If your current dashboard takes more than a minute to read, it's badly designed. See what a real distribution dashboard looks like. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Start free →</a></p>
</div>

<hr class="divider"/>

<p><em>Also read: <a href="/blog/livreur-vol-distribution-7-signaux">7 signals of a dishonest driver</a> and <a href="/blog/suivi-gps-livreurs-algerie-2026">GPS tracking in 2026</a>.</em></p>
`,
};

export default data;
