// app.js — Sensei Notes arayüz ve mantık (Vanilla JS)
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------- Tarih yardımcıları (yerel saat, YYYY-MM-DD) ----------
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const shift = (s, n) => { const d = toDate(s); d.setDate(d.getDate()+n); return ymd(d); };
const dLong = s => toDate(s).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'});
const dDay = s => toDate(s).toLocaleDateString('tr-TR', {weekday:'long'});

// ---------- Şema: kategoriler ve koleksiyonlar ----------
const CATS = [
  {id:'work', n:'İş', i:'💼'}, {id:'sport', n:'Spor Programı', i:'🏋️'},
  {id:'date', n:'Tarih Fikirleri', i:'💡'}, {id:'notes', n:'Günlük Notlar', i:'📝'}];
const COLL = {
  book:  {n:'Okunacak Kitaplar', i:'📚', status:['Almadım','Aldım','Okudum'], stats:['Toplam','Alınacak','Okunan'],
          f:[['title','Kitap adı','text',1],['author','Yazar','text'],['publisher','Yayınevi (isteğe bağlı)','text'],['note','Kişisel not','area']]},
  movie: {n:'İzlenecek Filmler', i:'🎬', status:['İzlemedim','İzledim'], stats:['Toplam','İzlenecek','İzlenen'],
          f:[['title','Film adı','text',1],['director','Yönetmen','text'],['year','Yapım yılı','number'],['genre','Tür','text'],['note','Kişisel not','area']]},
  place: {n:'Gezilecek Yerler', i:'🧭', status:['Gitmedim','Gittim'], stats:['Toplam','Gidilecek','Gidilen'],
          f:[['title','Yer adı','text',1],['city','Şehir','text'],['country','Ülke','text'],['note','Açıklama','area']]}
};
const TYPE_LABEL = {daily:'Günlük', book:'Kitap', movie:'Film', place:'Yer'};

// ---------- Durum ----------
const today = () => ymd(new Date());
const S = {tab:'daily', date:today(), follow:true, cat:'work', filter:'all', q:'', scope:'all', fav:false, desc:true, items:[]};
const theme = () => localStorage.getItem('theme') || 'auto';

function applyTheme() {
  const t = theme(), dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]').content = dark ? '#000000' : '#f2f2f7';
}

async function load() { S.items = await DB.all(); render(); }

// ---------- Filtreleme ----------
const norm = s => String(s ?? '').toLocaleLowerCase('tr');
const matches = (it, q) => norm([it.title, it.body, it.author, it.publisher, it.director, it.genre, it.year, it.city, it.country, it.note].join(' ')).includes(norm(q));
const byDate = list => list.sort((a, b) => S.desc ? b.created - a.created : a.created - b.created);
const favFilter = list => S.fav ? list.filter(i => i.fav) : list;

// ---------- Kart HTML ----------
function card(it, showType) {
  const meta = [];
  let body = '', pill = '';
  if (it.type === 'daily') {
    const c = CATS.find(c => c.id === it.cat);
    meta.push(showType ? `${dLong(it.date)} · ${c.n}` : new Date(it.created).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}));
    body = it.body ? `<p>${esc(it.body)}</p>` : '';
  } else {
    const C = COLL[it.type];
    if (showType) meta.push(TYPE_LABEL[it.type]);
    if (it.type === 'book') meta.push(it.author, it.publisher);
    if (it.type === 'movie') meta.push(it.director, it.year, it.genre);
    if (it.type === 'place') meta.push(it.city, it.country);
    if (it.type === 'movie' && it.status === 1 && it.rating) meta.push(`★ ${it.rating}/10`);
    body = it.note ? `<p>${esc(it.note)}</p>` : '';
    pill = `<button class="pill ${it.status > 0 ? 'done' : ''}" data-act="cycle" data-id="${it.id}">${C.status[it.status]}</button>`;
  }
  return `<div class="card" data-act="edit" data-id="${it.id}"><div class="b">
    ${it.title ? `<h3>${esc(it.title)}</h3>` : ''}<div class="meta">${meta.filter(Boolean).map(esc).join(' · ')}</div>${body}${pill}</div>
    <button class="star ${it.fav ? 'on' : ''}" data-act="fav" data-id="${it.id}" aria-label="Favori">${it.fav ? '★' : '☆'}</button></div>`;
}
const empty = (icon, msg) => `<div class="empty"><big>${icon}</big>${msg}</div>`;
const toolbar = n => `<div class="bar"><span>${n} kayıt</span><span class="row" style="margin:0">
  <button class="tool ${S.fav ? 'on' : ''}" data-act="favf">★ Favoriler</button>
  <button class="tool" data-act="sort">${S.desc ? 'Yeni → Eski' : 'Eski → Yeni'}</button></span></div>`;

// ---------- Ekranlar ----------
function dailyHTML() {
  const dayItems = S.items.filter(i => i.type === 'daily' && i.date === S.date);
  const chips = CATS.map(c => `<button class="chip ${S.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${c.id}">${c.i} ${c.n} (${dayItems.filter(i => i.cat === c.id).length})</button>`).join('');
  const list = byDate(favFilter(dayItems.filter(i => i.cat === S.cat)));
  const isToday = S.date === today();
  return `<div class="row dnav"><button data-act="prev">‹</button>
    <div class="d">${dLong(S.date)}<small>${dDay(S.date)}</small><input type="date" id="dp" value="${S.date}"></div>
    <button data-act="next">›</button></div>
    ${isToday ? '' : '<div class="row"><button class="tool" data-act="today">Bugüne dön</button></div>'}
    <div class="chips">${chips}</div>${toolbar(list.length)}
    ${list.length ? list.map(i => card(i)).join('') : empty('📝', 'Bu gün için bu kategoride kayıt yok.<br>＋ ile ilk notunu ekle.')}`;
}
function collHTML(t) {
  const C = COLL[t], all = S.items.filter(i => i.type === t);
  const cnt = k => all.filter(i => i.status === k).length;
  const stats = [all.length, cnt(0), cnt(C.status.length - 1)];
  const chips = ['Tümü', ...C.status].map((s, k) => `<button class="chip ${S.filter == (k ? k-1 : 'all') ? 'on' : ''}" data-act="flt" data-id="${k ? k-1 : 'all'}">${s}</button>`).join('');
  const list = byDate(favFilter(all.filter(i => S.filter === 'all' || i.status == S.filter)));
  return `<div class="stats">${stats.map((n, k) => `<div class="stat"><b>${n}</b><span>${C.stats[k]}</span></div>`).join('')}</div>
    <div class="chips" style="margin-top:10px">${chips}</div>${toolbar(list.length)}
    ${list.length ? list.map(i => card(i)).join('') : empty(C.i, 'Burada henüz kayıt yok.<br>＋ ile ekleyebilirsin.')}`;
}
function searchHTML() {
  let pool = S.items;
  if (S.scope === 'here') pool = S.tab === 'daily' ? pool.filter(i => i.type === 'daily' && i.cat === S.cat) : pool.filter(i => i.type === S.tab);
  const list = byDate(favFilter(pool.filter(i => matches(i, S.q))));
  const hereLbl = S.tab === 'daily' ? CATS.find(c => c.id === S.cat).n : COLL[S.tab]?.n || 'Bu bölüm';
  return `<div class="chips"><button class="chip ${S.scope === 'all' ? 'on' : ''}" data-act="scope" data-id="all">Her yerde</button>
    <button class="chip ${S.scope === 'here' ? 'on' : ''}" data-act="scope" data-id="here">${hereLbl} (tüm günler)</button></div>${toolbar(list.length)}
    ${list.length ? list.map(i => card(i, true)).join('') : empty('🔍', 'Sonuç bulunamadı.')}`;
}
function settingsHTML() {
  const t = theme();
  return `<div class="set"><h3>Görünüm</h3><div class="chips">${[['auto','Otomatik'],['light','Açık'],['dark','Koyu']].map(([k, n]) => `<button class="chip ${t === k ? 'on' : ''}" data-act="theme" data-id="${k}">${n}</button>`).join('')}</div></div>
    <div class="set"><h3>Yedekleme</h3><div class="meta">${S.items.length} kayıt cihazında saklanıyor. Düzenli yedek almanı öneririm.</div>
    <button class="big" data-act="export">⬇️ JSON olarak dışa aktar</button>
    <button class="big" data-act="import">⬆️ JSON yedeği içe aktar</button>
    <input type="file" id="file" accept=".json,application/json" hidden></div>`;
}

function render() {
  const coll = COLL[S.tab], searching = S.q.trim() && S.tab !== 'settings';
  document.body.classList.toggle('coll', !!coll);
  $('#badge').textContent = S.tab === 'daily' ? '📅 Günlük alan' : coll ? '🗂️ Kalıcı koleksiyon' : '⚙️ Ayarlar';
  $('#hTitle').textContent = S.tab === 'daily' ? 'Bugün: ' + dLong(today()) : coll ? coll.n : 'Ayarlar';
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#fab').hidden = S.tab === 'settings';
  $('#q').style.display = S.tab === 'settings' ? 'none' : '';
  $('#main').innerHTML = S.tab === 'settings' ? settingsHTML() : searching ? searchHTML() : S.tab === 'daily' ? dailyHTML() : collHTML(S.tab);
}

// ---------- Form (ekle / düzenle) ----------
let editing = null; // formda açık olan kayıt (silme için)
function openForm(type, it) {
  editing = it || null;
  const isNew = !it, isD = type === 'daily', C = COLL[type];
  let h = `<h2>${isNew ? 'Yeni' : 'Düzenle'}: ${isD ? 'günlük not' : C.n}</h2><form id="f">`;
  if (isD) {
    h += `<label>Tarih</label><input type="date" name="date" required value="${it?.date || S.date}">
      <label>Kategori</label><select name="cat">${CATS.map(c => `<option value="${c.id}" ${(it?.cat || S.cat) === c.id ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
      <label>Başlık (isteğe bağlı)</label><input name="title" value="${esc(it?.title)}">
      <label>Not</label><textarea name="body">${esc(it?.body)}</textarea>`;
  } else {
    C.f.forEach(([k, l, t, req]) => {
      h += `<label>${l}${req ? ' *' : ''}</label>` + (t === 'area' ? `<textarea name="${k}">${esc(it?.[k])}</textarea>` : `<input name="${k}" type="${t}" ${req ? 'required' : ''} value="${esc(it?.[k])}">`);
    });
    h += `<label>Durum</label><select name="status">${C.status.map((s, k) => `<option value="${k}" ${(it?.status ?? 0) == k ? 'selected' : ''}>${s}</option>`).join('')}</select>`;
    if (type === 'movie') h += `<div id="rt"><label>Kişisel puan (10 üzerinden)</label><select name="rating"><option value="">Puan yok</option>${[1,2,3,4,5,6,7,8,9,10].map(n => `<option ${it?.rating == n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
  }
  h += `<div class="btns">${isNew ? '' : '<button type="button" class="del" data-act="del">Sil</button>'}<button type="button" data-act="close">Vazgeç</button><button class="pri">Kaydet</button></div></form>`;
  $('#sheet').innerHTML = `<div class="panel">${h}</div>`; $('#sheet').hidden = false;
  const f = $('#f'), sync = () => { if ($('#rt')) $('#rt').style.display = f.status.value == 1 ? '' : 'none'; };
  if (f.status) f.status.onchange = sync; sync();
  f.onsubmit = async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f)), now = Date.now();
    if (isD && !v.title.trim() && !v.body.trim()) return alert('Başlık veya not yaz.');
    const o = {...(it || {id: crypto.randomUUID?.() || String(now) + Math.random(), type, fav: false, created: now}), ...v, updated: now};
    if (!isD) { o.status = +v.status; o.rating = o.status === 1 && v.rating ? +v.rating : null; }
    await DB.put(o);
    if (isD) { S.date = o.date; S.cat = o.cat; S.follow = o.date === today(); }
    $('#sheet').hidden = true; await load();
  };
  f.querySelector('input,textarea')?.focus?.();
}

// ---------- Olaylar ----------
const find = id => S.items.find(i => i.id === id);
const upd = async (it, ch) => { await DB.put({...it, ...ch, updated: Date.now()}); await load(); };
document.addEventListener('click', async e => {
  const nb = e.target.closest('nav button');
  if (nb) { S.tab = nb.dataset.tab; S.filter = 'all'; S.fav = false; S.scope = 'all'; $('#q').value = ''; S.q = ''; return render(); }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, it = id && find(id);
  e.stopPropagation();
  const A = {
    new: () => openForm(S.tab === 'daily' || S.tab === 'settings' ? 'daily' : S.tab),
    edit: () => openForm(it.type, it), close: () => $('#sheet').hidden = true,
    prev: () => { S.date = shift(S.date, -1); S.follow = false; render(); },
    next: () => { S.date = shift(S.date, 1); S.follow = S.date === today(); render(); },
    today: () => { S.date = today(); S.follow = true; render(); },
    cat: () => { S.cat = id; render(); }, flt: () => { S.filter = id === 'all' ? id : +id; render(); },
    scope: () => { S.scope = id; render(); }, favf: () => { S.fav = !S.fav; render(); }, sort: () => { S.desc = !S.desc; render(); },
    fav: () => upd(it, {fav: !it.fav}),
    cycle: () => upd(it, {status: (it.status + 1) % COLL[it.type].status.length, rating: null}),
    del: async () => { if (editing && confirm('Bu kayıt kalıcı olarak silinsin mi?')) { await DB.del(editing.id); $('#sheet').hidden = true; await load(); } },
    theme: () => { localStorage.setItem('theme', id); applyTheme(); render(); },
    export: exportJSON, import: () => $('#file').click()
  };
  A[a]?.();
});
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') $('#sheet').hidden = true; });
$('#q').addEventListener('input', e => { S.q = e.target.value; render(); });
document.addEventListener('change', e => {
  if (e.target.id === 'dp' && e.target.value) { S.date = e.target.value; S.follow = S.date === today(); render(); }
  if (e.target.id === 'file') importJSON(e.target.files[0]), e.target.value = '';
});

// ---------- Yedekleme ----------
function exportJSON() {
  const blob = new Blob([JSON.stringify({app:'sensei-notes', version:1, exported:new Date().toISOString(), items:S.items}, null, 1)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sensei-yedek-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function importJSON(file) {
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    const list = Array.isArray(d) ? d : d.items;
    if (!Array.isArray(list) || list.some(i => !i.id || !i.type)) throw 0;
    if (!confirm(`DİKKAT: Mevcut ${S.items.length} kayıt silinecek ve yedekteki ${list.length} kayıtla değiştirilecek. Devam edilsin mi?`)) return;
    await DB.replaceAll(list); await load(); alert('Yedek geri yüklendi.');
  } catch { alert('Geçersiz yedek dosyası.'); }
}

// ---------- Başlangıç ----------
// Gün değişince (uygulama arka plandan dönünce ya da gece yarısı) bugüne geç; eski günler silinmez.
function checkDay() { if (S.follow && S.date !== today()) { S.date = today(); render(); } else if (S.tab === 'daily') $('#hTitle').textContent = 'Bugün: ' + dLong(today()); }
document.addEventListener('visibilitychange', () => !document.hidden && checkDay());
setInterval(checkDay, 60000);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
applyTheme(); load();
navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
