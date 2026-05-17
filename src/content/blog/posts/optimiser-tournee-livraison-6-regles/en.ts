import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Delivery route optimization: 6 rules to save 2 hours a day',
  excerpt: 'A poorly planned route burns fuel, time, and customers. Six concrete rules to reorganize your routes and double their efficiency from week one.',
  tags: ['Delivery route optimization', 'Last-mile logistics', 'Route planning', 'Fleet efficiency', 'Fuel savings'],
  content: `
<p class="lead">Your driver leaves at 7:30 AM with 38 customers to visit. He returns at 7 PM, exhausted, with 6 deliveries undone. The problem is <strong>almost never</strong> the driver — it's the route he was given. Here are <span class="highlight-blue">6 simple rules</span> that save the distributors we work with an average of <strong>2 hours per day per truck</strong>.</p>

<h2>Rule 1 — Group by geographic zone, not by customer type</h2>

<p>The classic mistake: building the route from your spreadsheet sorted alphabetically or by category ("cafes first, then restaurants"). Result: the driver zigzags across the city all day.</p>

<div class="info-box">
  <div class="box-title">💡 The right approach</div>
  <p>Split the city into <strong>4 to 6 logical zones</strong> (quadrants, neighborhoods, corridors). Each route covers <strong>one zone only</strong> — or two adjacent zones. Never three.</p>
</div>

<p>For a mid-size city: North zone, Central (old town), West, South (suburbs), etc. One truck = one zone = one morning.</p>

<h2>Rule 2 — Start with the farthest customer</h2>

<p>This is counter-intuitive. Most routes start at the closest customer. Mistake: you end the day at the opposite end of the city, drained, in 5 PM rush-hour traffic.</p>

<div class="purple-box">
  <div class="box-title">📐 The arc rule</div>
  <p>Draw an <strong>arc</strong>: hit the farthest point first (early morning, light traffic, fresh driver), then work your way back toward the depot delivering customers along the way. End-of-route next to the depot = quick return = less fatigue.</p>
</div>

<h2>Rule 3 — Cluster "slow" customers into a dedicated time slot</h2>

<p>On every route, there are always <strong>2 or 3 customers</strong> who take 30-45 minutes each instead of the standard 8 minutes. Reasons: warehouse staff absent, complicated payment, manual unloading, mandatory chat with the owner.</p>

<p>If you scatter them through the route, they break the rhythm completely. If you cluster them into a <strong>fixed time slot</strong> (say, Tuesdays 10-11:30 AM), the driver knows what to expect and adapts pace before and after.</p>

<h2>Rule 4 — Eliminate the "dead stops" on the route</h2>

<p>A "dead stop" is a customer your driver visits but who <strong>almost never</strong> orders. Every distributor has them. Nobody dares to drop them "just in case."</p>

<div class="warning-box">
  <div class="box-title">⚠️ The brutal math</div>
  <p>Run the test: over 90 days, how many visits to this customer led to an order? If it's <strong>less than 30%</strong>, stop visiting systematically. Call ahead. Or visit every 15 days instead of every route.</p>
</div>

<p>A "ghost" customer costing 15 minutes per visit, at 5 wasted visits per month, is <strong>1h15 per month lost</strong>. For a single customer. Multiply by 6 or 7 ghost customers and you recover half a workday every month.</p>

<h2>Rule 5 — Prep the exact load the night before</h2>

<p>Morning loading = wasted time. Driver arrives at 7, waits for the warehouse, waits for labels, waits for forgotten items. He leaves at 8:30 instead of 7:30. One hour lost every day = <strong>260 hours per year</strong>, an entire month of work.</p>

<p>The fix: prep the load <strong>the night before</strong>, based on confirmed orders. In the morning, the driver arrives, loads in 15 minutes, leaves. That's it.</p>

<ul class="check-list">
  <li>Loading sheet generated the previous day at 5 PM</li>
  <li>Goods prepped and shrink-wrapped on pallets in the "depart tomorrow" zone</li>
  <li>Morning: quick check, signature, departure in 15 minutes</li>
  <li>Driver reaches the first customer at 8 AM instead of 9:30 AM</li>
</ul>

<h2>Rule 6 — Measure and adjust every week</h2>

<p>The perfect route doesn't exist on day one. It's built through <strong>small weekly corrections</strong>, based on real data:</p>

<div class="feature-grid">
  <div class="feature-card">
    <div class="fc-icon" style="background:#dbeafe;color:#1e40af">⏱️</div>
    <h4>Average time per customer</h4>
    <p>If a customer consistently exceeds 20 min, understand why</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#dcfce7;color:#166534">⛽</div>
    <h4>Fuel consumption</h4>
    <p>Kilometers driven ÷ customers visited</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#fef3c7;color:#92400e">❌</div>
    <h4>Failure rate</h4>
    <p>Failed deliveries by zone and day</p>
  </div>
  <div class="feature-card">
    <div class="fc-icon" style="background:#f3e8ff;color:#6b21a8">📞</div>
    <h4>Field calls</h4>
    <p>How many "customer's not here, what now?" calls per route</p>
  </div>
</div>

<h2>A real case: a beverage distributor</h2>

<p>Starting point (January 2026):</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">11h30</div>
    <div class="stat-label">Average route duration</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">28</div>
    <div class="stat-label">Customers visited on average</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#ef4444">4-7</div>
    <div class="stat-label">Failed deliveries / day</div>
  </div>
</div>

<p>After applying the 6 rules (6 weeks):</p>

<div class="stat-row">
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">9h20</div>
    <div class="stat-label">Average duration (-2h10)</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">34</div>
    <div class="stat-label">Customers visited (+21%)</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" style="color:#10b981">&lt;1</div>
    <div class="stat-label">Failed delivery / day</div>
  </div>
</div>

<p>Same driver. Same truck. Same city. Just a route <strong>thoughtfully designed</strong>. Result: more revenue, less fatigue, less fuel, and happier customers.</p>

<h2>How TrackSera helps in practice</h2>

<p>Building all this in Excel is possible, but you spend more time optimizing than delivering. Our routing module automates:</p>

<ul class="check-list">
  <li>Automatic customer clustering by zone</li>
  <li>Suggested visit order (geographic arc)</li>
  <li>Night-before loading-sheet generation</li>
  <li>"Ghost customer" detection (low order rate)</li>
  <li>Weekly report with the 4 performance indicators</li>
  <li>GPS history to see where time was really spent</li>
</ul>

<div class="success-box">
  <div class="box-title">✅ 2 hours a day, 40 hours a month</div>
  <p>That's a full workweek recovered every month, per truck. Across 5 trucks, you've earned a "free" driver. <a href="/register" style="color:#065f46;font-weight:700;text-decoration:underline">Start free →</a></p>
</div>

<hr class="divider"/>

<p><em>Also read: <a href="/blog/suivi-gps-livreurs-algerie-2026">GPS driver tracking in 2026</a> and <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 numbers to watch every morning</a>.</em></p>
`,
};

export default data;
