// site.js

// ========================
// ESTADO GLOBAL
// ========================
let products = [];     // Itens do estoque
let cart = [];         // Carrinho atual
let lastSale = null;   // Última venda (para impressão)

// ========================
// UTILITÁRIAS
// ========================
function show(id){ const el=document.getElementById(id); if(el) el.style.display='flex'; }
function hide(id){ const el=document.getElementById(id); if(el) el.style.display='none'; }

function thematicAlert(title, message, type='info'){
  const alertBox = document.getElementById('customAlert');
  const icon = document.getElementById('alertIcon');
  const t = document.getElementById('alertTitle');
  const m = document.getElementById('alertMessage');
  if(!alertBox || !icon || !t || !m) return alert(message);

  t.textContent = title;
  m.textContent = message;
  icon.innerHTML = '';
  icon.style.color = '';

  if(type === 'success'){ icon.innerHTML = '<i class="fas fa-check-circle"></i>'; icon.style.color = 'var(--color-success)'; }
  else if(type === 'error'){ icon.innerHTML = '<i class="fas fa-times-circle"></i>'; icon.style.color = 'var(--color-danger)'; }
  else { icon.innerHTML = '<i class="fas fa-info-circle"></i>'; icon.style.color = 'var(--color-primary)'; }

  alertBox.style.display = 'flex';
}
const _alertCloseBtn = document.getElementById('alertCloseBtn');
if(_alertCloseBtn) _alertCloseBtn.onclick = () => hide('customAlert');

function formatCurrency(v){
  const n = parseFloat(v) || 0;
  return new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(n);
}
function parseCurrency(text){
  if(typeof text !== 'string') return text;
  return parseFloat(text.replace('R$','').replace(/\./g,'').replace(',','.').trim());
}
function getNumberValue(id){
  const v = (document.getElementById(id)?.value || '0').toString().replace(',','.');
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ========================
// PRODUTOS (CRUD)
// ========================
async function loadProducts(searchQuery=''){
  try{
    const res = await fetch('/api/products');
    const data = await res.json();
    if(res.ok){
      products = Array.isArray(data.products) ? data.products : [];
      const filtered = products.filter(p =>
        (p.id||'').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name||'').toLowerCase().includes(searchQuery.toLowerCase())
      );
      renderProducts(filtered);
      loadSalesData();
    }else{
      thematicAlert('Erro de Produto', data.message || 'Falha ao carregar produtos.', 'error');
    }
  }catch(e){
    console.error(e);
    thematicAlert('Erro de Conexão', 'Não foi possível buscar produtos.', 'error');
  }
}

function renderProducts(list){
  const tbody = document.getElementById('productListBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(!list.length){
    tbody.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center;">Nenhum produto encontrado.</td></tr>';
    return;
  }
  list.forEach(p=>{
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${formatCurrency(p.price)}</td>
      <td class="${p.stock < 5 ? 'text-danger' : 'text-success'}">${p.stock}</td>
      <td>
        <button class="btn-success btn-small" title="Adicionar ao carrinho" onclick="addProductToCartById('${p.id}')"><i class="fas fa-cart-plus"></i></button>
        <button class="btn-primary btn-small" onclick="openProductModal('edit','${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-danger btn-small" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
  });
}

function openProductModal(mode, productId=''){
  const title = document.getElementById('productModalTitle');
  const btn = document.getElementById('btnSaveProduct');
  const idEl = document.getElementById('productId');
  const codeEl = document.getElementById('productCode');
  const nameEl = document.getElementById('productName');
  const priceEl = document.getElementById('productPrice');
  const stockEl = document.getElementById('productStock');

  if(idEl) idEl.value='';
  if(codeEl) { codeEl.value=''; codeEl.readOnly = (mode==='edit'); }
  if(nameEl) nameEl.value='';
  if(priceEl) priceEl.value='';
  if(stockEl) stockEl.value=0;

  if(title) title.textContent = (mode==='add') ? 'Cadastrar Novo Produto' : 'Editar Produto';
  if(btn) btn.textContent = (mode==='add') ? ' Salvar Produto' : ' Atualizar Produto';

  if(mode==='edit'){
    const p = products.find(x=>x.id===productId);
    if(p){
      if(idEl) idEl.value = p.id;
      if(codeEl) codeEl.value = p.id;
      if(nameEl) nameEl.value = p.name;
      if(priceEl) priceEl.value = Number(p.price||0).toFixed(2);
      if(stockEl) stockEl.value = p.stock||0;
    }
  }
  show('modalProduct');
}

async function saveProduct(){
  const id = document.getElementById('productCode')?.value.trim();
  const name = document.getElementById('productName')?.value.trim();
  const price = parseFloat(document.getElementById('productPrice')?.value);
  const stock = parseInt(document.getElementById('productStock')?.value);

  if(!id || !name || isNaN(price) || isNaN(stock)){
    return thematicAlert('Erro', 'Preencha todos os campos corretamente.', 'error');
  }
  try{
    const res = await fetch('/api/products', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({id, name, price, stock})
    });
    const data = await res.json();
    if(res.ok){
      thematicAlert('Sucesso!', data.message || 'Produto salvo.', 'success');
      hide('modalProduct');
      loadProducts();
    }else{
      thematicAlert('Erro', data.message || 'Falha ao salvar o produto.', 'error');
    }
  }catch(e){
    console.error(e);
    thematicAlert('Erro de Conexão','Não foi possível comunicar com o servidor.','error');
  }
}

async function deleteProduct(id){
  if(!confirm(`Tem certeza que deseja DELETAR o produto ${id}?`)) return;
  try{
    const res = await fetch(`/api/products/${id}`, { method:'DELETE' });
    const data = await res.json();
    if(res.ok){
      thematicAlert('Sucesso!', data.message || 'Produto removido.', 'success');
      loadProducts();
    }else{
      thematicAlert('Erro', data.message || 'Falha ao deletar o produto.', 'error');
    }
  }catch(e){
    console.error(e);
    thematicAlert('Erro de Conexão','Não foi possível comunicar com o servidor.','error');
  }
}

// ========================
// CARRINHO
// ========================
function renderCart(){
  const wrap = document.getElementById('cartItems');
  if(!wrap) return;
  wrap.innerHTML = '';
  if(!cart.length){
    wrap.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">Carrinho vazio.</div>';
  }
  cart.forEach((it, idx)=>{
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span class="item-qty">${it.qty}x</span>
      <div class="item-info">
        ${it.name} (${it.id})<br>
        <small>${formatCurrency(it.price)} x ${it.qty} = <strong>${formatCurrency(it.price*it.qty)}</strong></small>
      </div>
      <span class="item-remove" onclick="removeFromCart(${idx})"><i class="fas fa-times-circle"></i></span>
    `;
    wrap.appendChild(div);
  });
  updateCartTotal();
}

function updateCartTotal(){
  const total = cart.reduce((s,i)=>s+(Number(i.price||0)*Number(i.qty||0)), 0);
  const discount   = document.getElementById('discount_amount')   ? getNumberValue('discount_amount')   : 0;
  const additional = document.getElementById('additional_amount') ? getNumberValue('additional_amount') : 0;
  const adjusted   = Math.max(0, total - discount + additional);

  const el = document.getElementById('cartTotal');
  if(el) el.textContent = formatCurrency(adjusted);
  const ce = document.getElementById('checkoutTotalValue');
  if(ce) ce.textContent = formatCurrency(adjusted);

  return adjusted;
}

function addProductToCartById(productId){
  const p = products.find(x=>x.id===productId);
  if(!p) return thematicAlert('Erro','Produto não encontrado.','error');

  const idx = cart.findIndex(i=>i.id===p.id);
  const desired = (idx>-1 ? cart[idx].qty : 0) + 1;
  if(Number(p.stock||0) < desired) return thematicAlert('Estoque Insuficiente', `Só há ${p.stock} de ${p.name}.`, 'error');

  if(idx>-1){ cart[idx].qty += 1; } else { cart.push({ id:p.id, name:p.name, price:p.price, qty:1 }); }
  renderCart();
}

function addToCartLogic(){
  const code = document.getElementById('inputProductCode')?.value.trim();
  const qty  = parseInt(document.getElementById('inputQuantity')?.value);
  if(!code || isNaN(qty) || qty < 1) return thematicAlert('Erro','Informe o código e a quantidade.','error');

  const p = products.find(x => (x.id||'').toLowerCase() === code.toLowerCase());
  if(!p) return thematicAlert('Erro',`Produto ${code} não encontrado.`,'error');
  if(Number(p.stock||0) < qty) return thematicAlert('Estoque Insuficiente',`Apenas ${p.stock} em estoque.`,'error');

  const idx = cart.findIndex(i=>i.id===p.id);
  const desired = (idx>-1 ? cart[idx].qty : 0) + qty;
  if(Number(p.stock||0) < desired) return thematicAlert('Estoque Insuficiente','Quantidade excede o estoque.','error');

  if(idx>-1){ cart[idx].qty += qty; } else { cart.push({ id:p.id, name:p.name, price:p.price, qty }); }

  const codeEl = document.getElementById('inputProductCode');
  const qtyEl  = document.getElementById('inputQuantity');
  if(codeEl) codeEl.value='';
  if(qtyEl)  qtyEl.value=1;
  if(codeEl) codeEl.focus();
  renderCart();
}

function removeFromCart(index){
  cart.splice(index,1);
  renderCart();
}

function updateChange(){
  const total = updateCartTotal();
  const paid = parseFloat(document.getElementById('paid_amount')?.value || '0') || 0;
  const change = paid - total;
  const span = document.getElementById('checkoutChangeValue');
  if(span){
    span.textContent = formatCurrency(Math.max(0, change));
    span.style.color = change<0 ? 'var(--color-danger)' : (change>0 ? 'var(--color-success)' : 'var(--color-secondary)');
  }
  const btn = document.getElementById('modalCheckoutConfirm');
  if(btn) btn.disabled = change < 0;
}

function clearCart(){ cart = []; renderCart(); }

// Converte carrinho → formato da API
function buildItemsFromCart(){
  return (Array.isArray(cart) ? cart : []).map(it => ({
    product_id: it.id,
    quantity: Number(it.qty || 0),
    price_unit: Number(it.price || 0)
  }));
}

// ========================
// FINALIZAR VENDA (ENVIA "items")
// ========================
async function finishSale(){
  const total = updateCartTotal();
  if(!Array.isArray(cart) || cart.length === 0){
    return thematicAlert('Carrinho vazio','Adicione itens ao carrinho antes de finalizar.','error');
  }
  if(total <= 0){
    return thematicAlert('Erro','Total inválido.','error');
  }

  const payment_method = document.getElementById('payment_method')?.value || '';
  const paid_amount = parseFloat(document.getElementById('paid_amount')?.value || '0') || 0;
  if(!payment_method) return thematicAlert('Erro','Selecione a Forma de Pagamento.','error');
  if((paid_amount - total) < 0) return thematicAlert('Erro','Valor pago insuficiente.','error');

  const saleData = {
    items: buildItemsFromCart(),                      // << ESSENCIAL
    total: Number(total.toFixed(2)),
    payment_method,
    discount: document.getElementById('discount_amount')   ? getNumberValue('discount_amount')   : 0,
    additional: document.getElementById('additional_amount') ? getNumberValue('additional_amount') : 0,
    notes: document.getElementById('sale_notes') ? document.getElementById('sale_notes').value.trim() : '',
    customer_name: document.getElementById('customer_name') ? document.getElementById('customer_name').value.trim() : '',
    customer_cpf: document.getElementById('customer_cpf') ? document.getElementById('customer_cpf').value.replace(/\D/g,'') : ''
  };

  try{
    const res = await fetch('/api/sales/finish', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(saleData)
    });
    const data = await res.json();

    if(res.ok){
      const sale = data.sale || data;
      const saleId = sale.id || data.sale_id || '';

      // prepara dados p/ impressão
      lastSale = {
        sale_id: saleId,
        sale_date: sale.sale_date || new Date().toISOString(),
        total: sale.total ?? saleData.total,
        payment_method: sale.payment_method ?? saleData.payment_method,
        discount: sale.discount ?? saleData.discount,
        additional: sale.additional ?? saleData.additional,
        notes: sale.notes ?? saleData.notes,
        cart_items: saleData.items.map(it=>{
          const p = (cart||[]).find(c=>c.id===it.product_id) || {};
          return { id: it.product_id, name: p.name || it.product_id, price: it.price_unit, qty: it.quantity };
        })
      };

      thematicAlert('Venda Concluída', saleId ? `Venda #${String(saleId).slice(-6)} registrada e estoque atualizado!` : 'Venda registrada e estoque atualizado!', 'success');
      hide('modalCheckout');
      clearCart();
      loadProducts();

      try{ printReceipt(lastSale); }catch(e){ console.error('Erro ao imprimir recibo:', e); }
    }else{
      thematicAlert('Erro de Venda', data.message || 'Falha ao finalizar a venda.', 'error');
    }
  }catch(e){
    console.error(e);
    thematicAlert('Erro de Conexão','Não foi possível conectar ao servidor para finalizar a venda.','error');
  }
}

// ========================
// IMPRESSÃO
// ========================
function printReceipt(sale){
  if(!sale) return thematicAlert('Erro','Nenhuma venda para imprimir.','error');

  const win = window.open('', '_blank', 'width=300,height=500');
  if(!win) return thematicAlert('Erro','Pop-ups bloqueados.','error');

  const store = window.storeInfo || {
    name: localStorage.getItem('store_name') || 'Minha Loja',
    owner: localStorage.getItem('store_owner') || '',
    cnpj:  localStorage.getItem('store_cnpj')  || '',
    address: localStorage.getItem('store_address') || '',
    phone: localStorage.getItem('store_phone') || ''
  };

  let html = `
  <html><head><title>Recibo - ${sale.sale_id||''}</title>
  <style>
    body{font-family:monospace;font-size:11px;padding:8px}
    h2,h3{margin:4px 0;text-align:center}
    .line{border-bottom:1px dashed #000;margin:6px 0}
    .item{display:flex;justify-content:space-between;margin:3px 0}
    .total{font-size:12px;font-weight:bold;margin-top:8px}
    .small{font-size:10px}
    .store{text-align:center;margin-bottom:6px}
  </style></head><body>
  <div class="store">
    <h2>${store.name}</h2>
    ${store.owner?`<div class="small">Proprietário: ${store.owner}</div>`:''}
    ${store.address?`<div class="small">${store.address}</div>`:''}
    ${(store.cnpj||store.phone)?`<div class="small">${store.cnpj?`CNPJ: ${store.cnpj}`:''}${(store.cnpj&&store.phone)?' | ':''}${store.phone?`Tel: ${store.phone}`:''}</div>`:''}
  </div>
  <h3>RECIBO DE VENDA</h3>
  <div class="line"></div>
  <p class="small">Venda ID: ${(sale.sale_id||'').toString().slice(-6)}</p>
  <p class="small">Data: ${new Date(sale.sale_date||Date.now()).toLocaleString('pt-BR')}</p>
  <div class="line"></div>
  <p class="small">Qtd.  Descrição                     Preço Un.   Total</p>
  `;

  (sale.cart_items||[]).forEach(it=>{
    const desc = (it.name||'').substring(0,22).padEnd(22,' ');
    html += `
      <div class="item small">
        <span>${String(it.qty).padEnd(3,' ')} ${desc}</span>
        <span>${formatCurrency(it.price)}   ${formatCurrency(Number(it.price)*Number(it.qty))}</span>
      </div>`;
  });

  html += `
    <div class="line"></div>
    <div class="item total"><span>TOTAL:</span><span>${formatCurrency(sale.total||0)}</span></div>
    <div class="item small"><span>Pagamento:</span><span>${sale.payment_method||''}</span></div>
    <div class="line"></div>
    <div class="small">
      <p><strong>Desconto:</strong> ${formatCurrency(sale.discount||0)}</p>
      <p><strong>Adicional:</strong> ${formatCurrency(sale.additional||0)}</p>
      ${sale.notes?`<p><strong>Obs:</strong> ${sale.notes}</p>`:''}
    </div>
    <div class="line"></div>
    <h3>Obrigado! Volte Sempre.</h3>
  </body></html>`;

  win.document.write(html); win.document.close(); win.print();
  win.onafterprint = () => win.close();
}

// ========================
// RELATÓRIO / KPIs
// ========================
async function loadSalesData(){
  try{
    const res = await fetch('/api/sales/report');
    const data = await res.json();
    if(res.ok){
      const list = Array.isArray(data.sales) ? data.sales : [];
      const total = list.reduce((s,x)=>s+(Number(x.total||0)),0);
      const c1 = document.getElementById('kpiSalesCount');
      const c2 = document.getElementById('kpiTotalRevenue');
      if(c1) c1.textContent = list.length;
      if(c2) c2.textContent = formatCurrency(total);
      return list;
    }
  }catch(e){ console.error(e); }
  return [];
}

async function generateReport(){
  const { jsPDF } = window.jspdf;
  const list = await loadSalesData();
  if(!list.length) return thematicAlert('Relatório Vazio','Não há vendas registradas.','info');

  const total = list.reduce((s,x)=>s+(Number(x.total||0)),0);
  const doc = new jsPDF();

  const store = window.storeInfo || {
    name: localStorage.getItem('store_name') || 'Minha Loja',
    owner: localStorage.getItem('store_owner') || '',
    cnpj:  localStorage.getItem('store_cnpj')  || '',
    phone: localStorage.getItem('store_phone') || '',
    address: localStorage.getItem('store_address') || ''
  };

  doc.setFontSize(18); doc.text(store.name, 14, 20);
  doc.setFontSize(10);
  const meta=[];
  if(store.owner)  meta.push(`Proprietário: ${store.owner}`);
  if(store.cnpj)   meta.push(`CNPJ: ${store.cnpj}`);
  if(store.phone)  meta.push(`Tel: ${store.phone}`);
  if(store.address)meta.push(store.address);
  if(meta.length) doc.text(meta.join(' | '), 14, 26);

  doc.setFontSize(12);
  doc.text(`Faturamento Total: ${formatCurrency(total)}`, 14, 36);
  doc.text(`Total de Transações: ${list.length}`, 14, 42);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 48);

  const rows = list.map(v=>[
    (v.id||'').toString().slice(-6),
    new Date(v.sale_date).toLocaleString('pt-BR'),
    formatCurrency(v.total),
    v.payment_method
  ]);

  doc.autoTable({
    startY: 55,
    head: [['ID Venda','Data/Hora','Valor','Pagamento']],
    body: rows,
    styles:{fontSize:9},
    headStyles:{fillColor:[0,0,0], textColor:[255,255,255]}
  });

  doc.save(`Relatorio_PDV_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`);
  thematicAlert('Sucesso!','Relatório PDF gerado.','success');
}

// ========================
// INICIALIZAÇÃO (EVENTOS)
// ========================
document.addEventListener('DOMContentLoaded', ()=>{
  loadProducts();
  loadSalesData();

  const _btnSaveProduct = document.getElementById('btnSaveProduct');
  if(_btnSaveProduct) _btnSaveProduct.addEventListener('click', saveProduct);

  const _searchProduct = document.getElementById('searchProduct');
  if(_searchProduct) _searchProduct.addEventListener('input', e => loadProducts(e.target.value));

  const _btnAddToCart = document.getElementById('btnAddToCart');
  if(_btnAddToCart) _btnAddToCart.addEventListener('click', addToCartLogic);

  const _btnClearCart = document.getElementById('btnClearCart');
  if(_btnClearCart) _btnClearCart.addEventListener('click', clearCart);

  const _btnCheckout = document.getElementById('btnCheckout');
  if(_btnCheckout) _btnCheckout.addEventListener('click', ()=>{
    if(!cart.length) return thematicAlert('Carrinho Vazio','Adicione produtos ao carrinho.','info');
    const paidEl = document.getElementById('paid_amount'); if(paidEl) paidEl.value = '0.00';
    updateChange();
    show('modalCheckout');
  });

  const _paidAmount = document.getElementById('paid_amount');
  if(_paidAmount) _paidAmount.addEventListener('input', updateChange);

  const _confirm = document.getElementById('modalCheckoutConfirm');
  if(_confirm) _confirm.addEventListener('click', finishSale);

  const _discount = document.getElementById('discount_amount');
  if(_discount) _discount.addEventListener('input', updateChange);

  const _additional = document.getElementById('additional_amount');
  if(_additional) _additional.addEventListener('input', updateChange);

  const _btnGenerate = document.getElementById('btnGenerateReport');
  if(_btnGenerate) _btnGenerate.addEventListener('click', generateReport);

  const _btnLogout = document.getElementById('btnLogout');
  if(_btnLogout) _btnLogout.addEventListener('click', ()=>{ window.location.href='ilogin.html'; });
});
