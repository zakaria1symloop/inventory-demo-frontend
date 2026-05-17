import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'How to Calculate Distributor Margin: Formulas, Pitfalls, Benchmarks',
  excerpt:
    'Margin, markup, and profit are not the same thing — and confusing them ruins distributors. Here are the right formulas and sector benchmarks.',
  tags: [
    'Gross margin calculation',
    'Distributor profitability',
    'Markup vs margin',
    'Pricing strategy',
    'Finance for distributors',
  ],
  content: `
<p class="lead">"I sold for half a million this month — where is the money?" <span class="highlight-blue">Every distributor ends up asking this question.</span> The answer lives in a single number that too few really master: gross margin. Here's how to calculate it properly.</p>

<h2>Margin, markup, profit: stop confusing them</h2>

<p>Three words, three different formulas:</p>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">📊 Gross margin</div>
    <p>Profit ÷ <strong>Selling price</strong>. Expressed as a % of revenue. This is <em>the</em> reference metric.</p>
    <p><em>Ex. cost 100, sell 150 → margin = 50÷150 = 33%</em></p>
  </div>
  <div class="feature-item">
    <div class="feature-title">📈 Markup</div>
    <p>Profit ÷ <strong>Cost</strong>. Always higher than margin. Constantly confused with it.</p>
    <p><em>Ex. cost 100, sell 150 → markup = 50÷100 = 50%</em></p>
  </div>
  <div class="feature-item">
    <div class="feature-title">💵 Profit (bottom line)</div>
    <p>Gross margin × volume − fixed costs. The amount that actually stays in the bank at month-end.</p>
  </div>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ The "50% that isn't" trap</div>
  <p>"My supplier sells at 100, I sell at 150, that's a 50% margin!" Wrong. That's a 50% <em>markup</em>, but only a 33% <em>margin</em>. This single confusion is the #1 cause of pricing errors in distribution.</p>
</div>

<h2>The full cost formula</h2>

<p>A product's true cost is not what you paid the supplier. It's everything that puts that product in front of the end customer:</p>

<ol class="numbered-list">
  <li><strong>Supplier purchase price</strong> (net)</li>
  <li><strong>Customs duties</strong> (if imported)</li>
  <li><strong>Inbound transport</strong> (port → warehouse)</li>
  <li><strong>Banking fees</strong> (letter of credit, FX)</li>
  <li><strong>Storage</strong> (warehouse rent ÷ turnover rate)</li>
  <li><strong>Handling</strong> (warehouse payroll ÷ units)</li>
  <li><strong>Breakage, theft, expiry</strong> (≈ 1-3% depending on sector)</li>
  <li><strong>Distribution</strong> (fuel, driver wages, vehicle wear ÷ routes)</li>
  <li><strong>Admin overhead</strong> (invoicing, accounting, support ÷ units)</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 The 1.4× rule</div>
  <p>For most distributors, the <strong>true landed cost</strong> is roughly <strong>1.4 times</strong> the supplier purchase price. If you buy at 100, the cost to <em>deliver</em> the unit to the customer hovers around 140. Any margin calc that uses only the purchase price is an illusion.</p>
</div>

<h2>Sector benchmarks</h2>

<p>Here are typical gross and net margins observed across distribution sectors (source: field surveys, TrackSera user feedback):</p>

<table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
<thead>
<tr style="background: #f3f4f6;">
<th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Sector</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Typical gross margin</th>
<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Net margin*</th>
</tr>
</thead>
<tbody>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">General grocery</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">8-15%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2-5%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Beverages (water, soft drinks)</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">12-22%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">4-8%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Dairy</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">7-12%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2-4%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Hygiene & cosmetics</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">18-30%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">7-12%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Consumer electronics</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5-12%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">1-4%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Pharma / parapharma</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">15-25%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">5-9%</td></tr>
<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Auto parts</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">20-40%</td><td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">8-15%</td></tr>
<tr><td style="padding: 12px;">Construction materials</td><td style="text-align: center; padding: 12px;">10-18%</td><td style="text-align: center; padding: 12px;">3-7%</td></tr>
</tbody>
</table>

<p><em>* Net margin = after deducting all fixed costs (rent, payroll, taxes, etc.)</em></p>

<h2>5 levers to grow your margin</h2>

<ol class="numbered-list">
  <li>
    <strong>Renegotiate purchase prices</strong><br/>
    A 2% discount from the supplier = 2 points of margin gained directly. On a million in revenue, that's serious money every month.
  </li>
  <li>
    <strong>Optimize delivery routes</strong><br/>
    Fuel is the second-biggest variable cost after purchasing. See <a href="/blog/optimiser-tournee-livraison-6-regles">6 rules to optimize a delivery route</a>.
  </li>
  <li>
    <strong>Drop unprofitable customers</strong><br/>
    20% of customers generate 80% of profit. The rest often cost more than they bring in. Identify them and stop delivering at a loss.
  </li>
  <li>
    <strong>Kill dead products</strong><br/>
    A SKU that sells once a month locks up cash, occupies space, and carries a high expiry risk. Pull it from the catalog.
  </li>
  <li>
    <strong>Calculate margin per customer / per product</strong><br/>
    Not only the global margin. Without the detail, you're piloting blind.
  </li>
</ol>

<div class="success-box">
  <div class="box-title">✓ What's possible</div>
  <p>One of our beverage-distribution customers moved from 11% to 16% gross margin in 6 months — just by (1) renegotiating with 2 suppliers, (2) dropping 18 unprofitable customers, (3) deleting 47 SKUs that weren't turning. Revenue didn't drop. More money simply stayed in the bank.</p>
</div>

<div class="divider"></div>

<h2>How TrackSera gives you margin in real time</h2>

<p>TrackSera computes automatically:</p>

<ul class="check-list">
  <li>Gross margin per product (using weighted average cost)</li>
  <li>Gross margin per customer (over 30, 90, 365 days)</li>
  <li>Gross margin per driver, vehicle, route</li>
  <li>Gross margin per region / per business sector</li>
  <li>Automatic loss-sale detection (alert)</li>
  <li>Top/bottom SKUs by absolute margin value</li>
  <li>Period-over-period comparison (this month vs last)</li>
</ul>

<p><a href="/register">Start a 14-day free trial</a> and uncover your true margins.</p>

<p><em>See also: <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 numbers to watch every morning</a>, <a href="/blog/tva-9-19-algerie-distribution">VAT rates for distributors</a>, and <a href="/blog/excel-vs-logiciel-distribution">Excel vs software: what it really costs you</a>.</em></p>
`,
};

export default data;
