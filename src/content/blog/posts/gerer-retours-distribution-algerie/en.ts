import type { LocalePostContent } from '../../_types';

const data: LocalePostContent = {
  title: 'Returns Management in Distribution: A Practical Playbook',
  excerpt:
    'Badly handled returns cost distributors 3-5% of annual revenue. Here is the workflow to trace, account for, and recover every unit and every dollar.',
  tags: [
    'Returns management',
    'Credit notes',
    'Inventory accounting',
    'Reverse logistics',
    'Distribution operations',
  ],
  content: `
<p class="lead">Returns are the topic everyone hates: the customer complains, the driver loses time, the warehouse grumbles, the accountant pulls their hair out. <span class="highlight-blue">Yet, badly handled, returns cost 3 to 5% of annual revenue</span> — equal to an entire net margin in some sectors. Here is how to take control.</p>

<h2>The 4 types of returns in distribution</h2>

<div class="feature-grid">
  <div class="feature-item">
    <div class="feature-title">↪️ Customer return (credit note)</div>
    <p>The customer sends a product back. Causes: quality, wrong item, expiry, refusal, transport damage.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">↩️ Supplier return</div>
    <p>You send a product back to the supplier. Causes: defect, surplus, expiry, contract dispute.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">🚫 Refused on delivery</div>
    <p>The customer refuses the goods at the door. The driver brings them back. A particularly common case in informal trade.</p>
  </div>
  <div class="feature-item">
    <div class="feature-title">💔 Breakage / expiry</div>
    <p>Not a return strictly speaking, but an inventory write-off that must be recorded. Eats directly into your margin.</p>
  </div>
</div>

<h2>The 6-step method to trace every return</h2>

<h3>1. Record it immediately (not "later")</h3>

<p>A return not entered the same day has a 60% chance of being lost — either forgotten, or the customer pays the <em>full</em> invoice without raising it, and you keep money that doesn't belong to you.</p>

<div class="warning-box">
  <div class="box-title">⚠️ The phantom return</div>
  <p>The driver brings the goods back. No one issues the credit note. The customer pays what they originally ordered. Six months later, during stock-take, you find "phantom" stock and no one knows where it came from. Seen 100 times.</p>
</div>

<h3>2. Identify the precise cause</h3>

<p>Not just "customer return". <em>Why</em>?:</p>

<ul class="check-list">
  <li>Wrong product reference picked</li>
  <li>Wrong quantity shipped</li>
  <li>Product damaged in transit</li>
  <li>Product defective from the factory</li>
  <li>Product expired</li>
  <li>Customer refusal (order canceled)</li>
  <li>Price error on the invoice</li>
</ul>

<p>Without this analysis, you cannot <em>reduce</em> returns. And the higher your return rate, the more your margin gets eaten.</p>

<h3>3. Decide what happens to the product</h3>

<p>Three cases, three treatments:</p>

<ol class="numbered-list">
  <li><strong>Resellable</strong>: back to main stock, ready for another customer</li>
  <li><strong>Repairable / damaged</strong>: "B-grade" or "outlet" stock, sold at a discount</li>
  <li><strong>Broken / expired</strong>: inventory write-off, accounted as a definitive loss</li>
</ol>

<h3>4. Issue the credit note properly</h3>

<p>The credit note must include:</p>

<ul class="check-list">
  <li>A sequential number (separate from invoice numbering)</li>
  <li>Reference to the original invoice</li>
  <li>Issue date</li>
  <li>Line-level detail: products, quantities, net price, VAT</li>
  <li>Reason for the return</li>
  <li>Legal mentions (company tax IDs)</li>
</ul>

<h3>5. Update the customer account</h3>

<p>The credit note reduces the customer's balance:</p>

<ul>
  <li>If the customer already paid the original invoice → the credit note becomes a credit usable on the next order, or a refund</li>
  <li>If the customer hasn't paid yet → the credit note reduces the outstanding debt</li>
</ul>

<h3>6. Regularize VAT in the monthly return</h3>

<p>The credit note reduces collected VAT for the month. If you forget this regularization, you pay VAT on money you never received.</p>

<h2>The special case: supplier returns</h2>

<p>When you send a product back to your supplier, the workflow flips:</p>

<ol class="numbered-list">
  <li><strong>Defect documentation</strong> at receipt (photos, written record)</li>
  <li><strong>Written notification</strong> to the supplier within the deadline (typically 48h for visible defects, 6 months for hidden ones)</li>
  <li><strong>Return note</strong> issued by you</li>
  <li><strong>Supplier credit note</strong> received in return (demand it — non-negotiable)</li>
  <li><strong>Stock update</strong>: returned goods leave inventory</li>
  <li><strong>Settlement</strong>: deducted from the next invoice or refunded directly</li>
</ol>

<div class="info-box">
  <div class="box-title">💡 Tactic: block the payment</div>
  <p>Until you receive the supplier credit note, don't pay. Many suppliers "forget" to issue the credit if you've already paid. Blocking the payment = you keep negotiation power.</p>
</div>

<h2>The 4 mistakes that cost a fortune</h2>

<div class="warning-box">
  <div class="box-title">⚠️ Mistake #1: No sequential numbering on credit notes</div>
  <p>Tax authorities require a continuous sequence. "CN-001, CN-002..." must be strictly sequential, just like invoices.</p>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Mistake #2: Credit note with no reference to the original invoice</div>
  <p>Without the link, the credit note is invalid for the tax authority. And impossible to trace internally.</p>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Mistake #3: Not separating "breakage" from "return"</div>
  <p>A product broken in the warehouse is not a customer return. It's a direct loss. Different accounting treatment.</p>
</div>

<div class="warning-box">
  <div class="box-title">⚠️ Mistake #4: Forgetting VAT in the monthly regularization</div>
  <p>If you don't subtract the VAT on credit notes in your monthly return, you pay "imaginary" VAT. A meaningful volume of credit notes can mean thousands paid for nothing.</p>
</div>

<div class="divider"></div>

<h2>How TrackSera handles returns</h2>

<ul class="check-list">
  <li>Customer-return module linked directly to the original invoice (one click on the invoice → "create return")</li>
  <li>Automatic stock destination selection (main, repair, breakage)</li>
  <li>Automatic credit note generation with separate sequential numbering</li>
  <li>Automatic update of customer balance and monthly VAT</li>
  <li>Supplier-return module with approval workflow</li>
  <li>Returns dashboard by cause / driver / product / customer (to find systemic issues)</li>
  <li>Alert when a customer exceeds an abnormal return rate</li>
</ul>

<p><a href="/register">Start a 14-day free trial</a> and stop bleeding money on returns.</p>

<p><em>See also: <a href="/blog/stock-fantome-ecart-physique-informatique">Phantom stock: why your numbers don't match</a>, <a href="/blog/logiciel-facturation-algerie-2026">Invoicing software guide</a>, and <a href="/blog/calculer-marge-distributeur-algerie">How to calculate margin</a>.</em></p>
`,
};

export default data;
