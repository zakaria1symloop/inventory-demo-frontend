import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'VAT for Distributors: How to Pick the Right Rate (2026 Guide)',
  excerpt:
    'Applying the wrong VAT rate is the #1 way distributors trigger tax audits and lose customers. Here is how to set up rates correctly in your software.',
  tags: [
    'VAT rates',
    'Tax compliance',
    'Distribution accounting',
    'Invoice software',
    'VAT guide',
  ],
  content: `
<p class="lead">"Which VAT rate do I apply?" is the most frequent question we get from new distributors. <span class="highlight-blue">And about 4 out of 10 businesses apply the wrong rate on at least one product</span>, which ends in a tax reassessment or an angry customer. Here is the complete guide.</p>

<h2>Why VAT rate selection matters</h2>

<p>Most countries operate VAT on two or three tiers — a reduced rate for essentials and a standard rate for everything else. Algeria, for example, uses <strong>9%</strong> (reduced) and <strong>19%</strong> (standard) since the 2017 finance law. Morocco uses 20% as standard, Tunisia 19%, and rates are different again in Sub-Saharan Africa and the Gulf.</p>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">Reduced rate</div>
    <p>Applies to <strong>essential goods</strong> and socially-protected categories: staple food, healthcare, medicines, household energy, books, school supplies.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">Standard rate</div>
    <p>Applies to <strong>everything else</strong> by default: processed goods, commercial services, appliances, electronics, clothing, etc.</p>
  </div>
</div>

<div class="info-box">
  <div class="box-title">💡 The simple rule</div>
  <p>If the product is on the official reduced-rate list, the reduced rate applies. <strong>Otherwise, the standard rate applies by default.</strong> There's no in-between.</p>
</div>

<h2>Typical products at the reduced rate</h2>

<h3>Staple food</h3>

<ul class="check-list">
  <li>Bread, semolina, wheat flour</li>
  <li>Pasteurized milk, powdered milk, infant formula</li>
  <li>Cooking oil (sunflower, soybean, blended)</li>
  <li>Sugar (crystallized and refined)</li>
  <li>Rice</li>
  <li>Subsidized pasta and couscous — <strong>only</strong> when registered under the local support scheme</li>
  <li>Pulses: chickpeas, lentils, dried beans</li>
  <li>Fresh local fruits and vegetables</li>
  <li>Unprocessed fresh meat (beef, lamb, poultry)</li>
  <li>Fresh eggs</li>
</ul>

<h3>Health and medicines</h3>

<ul class="check-list">
  <li>Medicines listed on the national pharmacopoeia</li>
  <li>Medical equipment (beds, wheelchairs, prosthetics)</li>
  <li>Therapeutic infant formula</li>
</ul>

<h3>Education and culture</h3>

<ul class="check-list">
  <li>School and university textbooks</li>
  <li>School notebooks</li>
  <li>Local newspapers and magazines</li>
</ul>

<h3>Household energy</h3>

<ul class="check-list">
  <li>Residential natural gas</li>
  <li>Residential electricity (social tariff)</li>
  <li>Bottled LPG (butane cylinders)</li>
</ul>

<h2>Typical products at the standard rate</h2>

<p>By default, anything not in the reduced-rate list falls under the standard rate. For distributors, the most common categories are:</p>

<h3>Processed food</h3>

<ul class="check-list">
  <li>Soft drinks, industrial fruit juices, bottled water</li>
  <li>Beer, alcohol (plus excise taxes)</li>
  <li>Biscuits, cakes, industrial pastries</li>
  <li>Chocolate, candy, confectionery</li>
  <li>Yogurts, cheese, butter, cream</li>
  <li>Canned goods (vegetables, meat, fish)</li>
  <li>Sauces, condiments, industrial spices</li>
  <li>Coffee, tea, herbal infusions</li>
</ul>

<h3>Hygiene, cosmetics, parapharmacy</h3>

<ul class="check-list">
  <li>Soaps, shower gels, shampoos</li>
  <li>Toothpaste, toothbrushes, deodorants</li>
  <li>Cosmetics (makeup, perfumes)</li>
  <li>Diapers, sanitary products</li>
  <li>Food supplements (unless listed)</li>
</ul>

<h3>Equipment and industry</h3>

<ul class="check-list">
  <li>Appliances (fridges, washing machines, air conditioners)</li>
  <li>Electronics (TVs, smartphones, computers)</li>
  <li>Clothing and footwear</li>
  <li>Furniture and home goods</li>
  <li>Construction materials (with some exceptions)</li>
  <li>Vehicles and auto parts</li>
</ul>

<h2>Zero-rated and exempt operations</h2>

<p>Some operations are exempt from VAT — you invoice at 0% but you keep the right to reclaim VAT on your purchases:</p>

<ul class="check-list">
  <li><strong>Exports</strong>: sales outside the country</li>
  <li><strong>Duty-free sales</strong> to companies under export schemes</li>
  <li><strong>Raw agricultural products</strong> sold directly by the producer</li>
  <li><strong>Medical and hospital services</strong></li>
  <li><strong>Licensed public and private education</strong></li>
  <li><strong>Urban public transport</strong></li>
  <li><strong>Residential rentals</strong> (not commercial)</li>
</ul>

<div class="warning-box">
  <div class="box-title">⚠️ Exempt ≠ out of scope</div>
  <p>An exempt operation is still inside the VAT regime — you must declare it at 0%. An out-of-scope operation (membership dues, salaries) doesn't appear at all on the VAT return.</p>
</div>

<h2>Special cases that trip distributors up</h2>

<div class="purple-box">
  <div class="box-title">🎯 "Plain milk vs flavored milk"</div>
  <p>Plain pasteurized milk: reduced rate. Chocolate or flavored milk: standard rate. Many distributors bill the whole range at the reduced rate out of habit — a classic mistake that ends in reassessment.</p>
</div>

<div class="purple-box">
  <div class="box-title">🎯 "Subsidized pasta"</div>
  <p>Couscous and semolina: reduced rate. Industrial pasta (lasagna, spaghetti): standard rate. Why? Only "staple" pasta varieties qualify for the subsidy scheme. Check the latest list before you configure your catalog.</p>
</div>

<div class="purple-box">
  <div class="box-title">🎯 "Milk-based yogurt"</div>
  <p>Milk: reduced rate. Yogurt: standard rate (processed). Even plain yogurt, even organic — still standard rate.</p>
</div>

<div class="purple-box">
  <div class="box-title">🎯 "Imported products"</div>
  <p>The VAT rate matches the local equivalent product. Imported pasta does not magically become eligible for the reduced rate just because it comes from Italy.</p>
</div>

<h2>How to configure your software correctly</h2>

<ol class="numbered-list">
  <li><strong>Set a default rate per product category</strong> — e.g. "Soft drinks" → standard, "Pasteurized milk" → reduced</li>
  <li><strong>Allow per-product override</strong> — a specific SKU can deviate from its category rule</li>
  <li><strong>Allow per-line override on invoices</strong> — for edge cases</li>
  <li><strong>Show VAT broken down at the invoice footer</strong> — net subtotals and VAT amounts per rate, plus grand total</li>
  <li><strong>Generate a monthly VAT summary</strong> — for the tax authority filing</li>
</ol>

<h2>What it costs when you get it wrong</h2>

<div class="warning-box">
  <div class="box-title">If you under-charge VAT</div>
  <p>The tax authority will claim:</p>
  <ul>
    <li>The missing VAT (the rate gap × net amount)</li>
    <li>Plus a <strong>penalty</strong> on the uncollected VAT (often 25% or more)</li>
    <li>Plus <strong>late interest</strong> until you regularize</li>
  </ul>
  <p>On serious volumes, these penalties can match an entire month of profit.</p>
</div>

<div class="warning-box">
  <div class="box-title">If you over-charge VAT</div>
  <p>No tax penalty (you've paid "too much"), but:</p>
  <ul>
    <li>Your customer can <strong>demand a refund</strong> of the difference</li>
    <li>Your prices look higher than competitors — lost sales</li>
  </ul>
</div>

<div class="divider"></div>

<h2>How TrackSera handles VAT</h2>

<p>In TrackSera, you configure:</p>

<ul class="check-list">
  <li>A default VAT rate at the <strong>product-category</strong> level</li>
  <li>An override at the product level</li>
  <li>An override at the invoice-line level (exceptional cases)</li>
  <li>Automatic generation of the monthly VAT summary for filing</li>
  <li>Inconsistency detection (e.g. "Milk" product at the standard rate triggers an alert)</li>
  <li>Bilingual Arabic/French/English VAT labels on invoices</li>
</ul>

<p><a href="/register">Start a 14-day free trial</a> and configure your VAT correctly from day one.</p>

<p><em>See also: <a href="/blog/logiciel-facturation-algerie-2026">Invoicing software guide</a>, <a href="/blog/calculer-marge-distributeur-algerie">How to calculate distributor margin</a>, and <a href="/blog/passer-excel-logiciel-distribution">How to move from Excel to software</a>.</em></p>
`,
};

export default data;
