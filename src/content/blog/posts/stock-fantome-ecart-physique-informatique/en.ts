import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Phantom stock: why your physical inventory doesn\'t match your system',
  excerpt: 'Every distributor eventually discovers the painful gap: actual stock doesn\'t match what the system shows. Here are the real causes and the fix that closes the gap for good.',
  tags: ['Phantom inventory', 'Stock accuracy', 'Warehouse management', 'Inventory variance', 'Shrinkage'],
  content: `
<p class="lead">You're running quarterly stocktake. Your spreadsheet says: <strong>1,840 cartons</strong>. Physical count says: <strong>1,713 cartons</strong>. Variance: 127 cartons. At $28 per unit, you just uncovered a <span class="highlight-blue">$3,556 hole</span> in your inventory. Where did it come from? Nobody knows. And that's exactly the phantom stock problem.</p>

<h2>What is phantom stock, exactly?</h2>

<p>It's the gap — often inexplicable at first glance — between:</p>

<ul class="check-list">
  <li><strong>Theoretical stock</strong> (what your system says, Excel or software)</li>
  <li><strong>Physical stock</strong> (what's actually on your shelves and in your cold rooms)</li>
</ul>

<div class="info-box">
  <div class="box-title">💡 A universal number</div>
  <p>Every serious logistics study confirms it: in a non-digitized distribution operation, the average gap between theoretical and physical stock is <strong>6 to 12% in value</strong>. For a distributor doing $5M/year, that's <strong>$300K to $600K of "phantom" inventory every year</strong>.</p>
</div>

<h2>The 7 real causes of phantom stock</h2>

<h3>1. Partial deliveries entered as complete</h3>
<p>Your supplier delivers 500 cartons but 12 are missing from the shipment. Your warehouse staff, rushed, signs the delivery note without checking and enters 500 in the system. Those 12 cartons exist only in the spreadsheet — pure phantom stock.</p>

<h3>2. Sales not deducted from stock</h3>
<p>A driver leaves with 50 cartons. He sells 47 and brings 3 back. On return, nobody enters the movement in the system — or someone does it two days later with rough numbers. Result: the system still thinks you have 50 cartons available.</p>

<h3>3. Undeclared breakage</h3>
<p>A carton drops, 2 bottles break. Common. The problem: often, nobody removes the 2 bottles from the accounting system. They stay in "theoretical stock" forever.</p>

<div class="warning-box">
  <div class="box-title">⚠️ Breakage is 1 to 3% of revenue</div>
  <p>For beverages, fresh goods, glass: annual breakage represents 1 to 3% of revenue. If it's not tracked, that's the equivalent in phantom stock piling up month after month.</p>
</div>

<h3>4. Informal "loans" between branches</h3>
<p>"Lend me 20 cartons, I'll give them back tomorrow." Of course, nobody ever really returns them, and nobody enters the transfer in the system. Branches trade phantom stock between each other.</p>

<h3>5. Barcode or SKU errors</h3>
<p>You have 3 very similar SKUs (Oil 1L, Oil 2L, Oil 5L). The warehouse worker scans the wrong one at unloading. The system removes 1L instead of 5L. Two errors at once: phantom surplus on one product, phantom shortage on the other.</p>

<h3>6. Customer returns left in limbo</h3>
<p>A customer returns 5 cartons "damaged in transit." The driver brings them back. The warehouse worker drops them in a "to sort" corner. Three weeks later, they're forgotten — neither returned to sellable stock nor recorded as breakage. <strong>Phantom stock.</strong></p>

<h3>7. Plain theft</h3>
<p>The hardest cause to admit, but the most frequent in large variances. Not necessarily large-scale theft: 2 cartons that "fall off the truck" each week × 52 weeks × $35 = <strong>$3,640/year</strong>.</p>

<h2>How to know if you're affected (you are)</h2>

<p>The question isn't <em>"do I have phantom stock?"</em>. Every distributor does. The real question is: <strong>how much, and where?</strong></p>

<div class="purple-box">
  <div class="box-title">🔍 The quick diagnostic</div>
  <p>Run a full count on <strong>one product family</strong> (say, all cooking oils). Compare to theoretical stock. Calculate the variance %. Extrapolate across your entire inventory. In 2 hours you'll have an honest estimate of your total phantom hole.</p>
</div>

<p>In 95% of cases, the result hurts. But it's the first step toward a real solution.</p>

<h2>Why Excel CANNOT solve this</h2>

<p>Excel is a great tool, but it has three fatal flaws for stock tracking:</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">🙈</div>
    <h4>No real-time</h4>
    <p>Edits are entered in the evening or the next day — variances pile up before detection</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">❌</div>
    <h4>No control</h4>
    <p>Anyone can change any cell. Zero audit trail.</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fee2e2;color:#991b1b">📵</div>
    <h4>No field link</h4>
    <p>The driver cannot update stock from their phone in real time</p>
  </div>
</div>

<h2>The fix: a single stock flow, closed end-to-end</h2>

<p>To kill phantom stock, no movement can exist <strong>outside the system</strong>. Concretely:</p>

<ol class="numbered-list">
  <li><strong>Supplier receipt</strong>: warehouse scans and counts, variance vs purchase order is displayed immediately</li>
  <li><strong>Inter-warehouse transfer</strong>: one button in the app, full traceability, no more "verbal loans"</li>
  <li><strong>Truck loading</strong>: everything leaving the depot is tagged into the "in-route" stock</li>
  <li><strong>Field sale</strong>: each sale instantly deducts from the truck's stock</li>
  <li><strong>Depot return</strong>: what comes back is re-integrated, variances are calculated automatically</li>
  <li><strong>Breakage and loss</strong>: mandatory entry with photo and reason, no "black hole" possible</li>
  <li><strong>Periodic count</strong>: automatic reconciliation, variances flagged and assigned to a responsible person</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 The "transparency" effect</div>
  <p>As soon as everything is tracked, <strong>phantom stock drops 70 to 90% in one month</strong>. Not because people suddenly became honest — but because every action now has a visible consequence. The deterrent effect is massive.</p>
</div>

<h2>What TrackSera does differently</h2>

<p>Our stock module was designed after 6 months of observation in real-world warehouses. Not from a desk. Concretely:</p>

<ul class="check-list">
  <li><strong>Real-time</strong> stock synced between depot, truck, and driver tablet</li>
  <li>Multi-warehouse: see where every product is, to the second</li>
  <li>Barcode and scan built-in — end of SKU errors</li>
  <li>Mandatory breakage entry with photo and reason</li>
  <li>Automatic variance reports at every end-of-route</li>
  <li>Full history: who edited what, when, from where</li>
  <li>Critical-threshold alerts to anticipate stockouts (see <a href="/blog/tableau-de-bord-distributeur-5-chiffres">the 5 dashboard numbers</a>)</li>
</ul>

<div class="success-box">
  <div class="box-title">✅ Recover your money</div>
  <p>Recovering 80% of phantom stock is the equivalent of 2 to 4% extra margin across your entire business. For the average distributor, that pays for TrackSera <strong>30 times over in a year</strong>. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Start now →</a></p>
</div>

<hr class="divider"/>

<p><em>Also read: <a href="/blog/livreur-vol-distribution-7-signaux">7 signals of a dishonest driver</a>, <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 numbers to watch every morning</a>, and <a href="/blog/optimiser-tournee-livraison-6-regles">6 rules to optimize a route</a>.</em></p>
`,
};

export default data;
