import {copy, contacts, sources, inquiry} from './content.mjs';

const query = new URLSearchParams(location.search);
let lang = query.get('lang') === 'ru' ? 'ru' : 'de';
let route = query.get('route') === 'study' ? 'study' : 'care';
const completed = {care:new Set(),study:new Set()};
const app = document.querySelector('#app');
const dialog = document.querySelector('#mail-dialog');
let toastTimer;
let lastTrigger;
const esc = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const paths = {
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 7-5 1 3-7 5-1Z"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 heart:'<path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z"/><path d="M8 12h2l1-2 2 5 1-3h2"/>',
 book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 external:'<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 link:'<path d="m10 13 4-4m-6 1L5 13a4 4 0 0 0 6 6l3-3m-4-8 3-3a4 4 0 0 1 6 6l-3 3"/>',
 print:'<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7Z"/><path d="M17 11h1"/>',
 leaf:'<path d="M20 3C8 2 2 9 6 15c5 7 15-1 14-12ZM4 21 16 8"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
};
const icon = (name, className='') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
const external = (url, label, className='') => `<a class="${className}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}${icon('external')}</a>`;
const source = (key, label) => external(sources[key][1],label || sources[key][0],'source-link');

function updateURL() {
 const url = new URL(location.href);
 url.searchParams.set('lang',lang);
 url.searchParams.set('route',route);
 history.replaceState(null,'',url);
}

function render(focusId) {
 const t = copy[lang];
 const isCare = route === 'care';
 document.documentElement.lang = lang;
 document.title = t.pageTitle;
 document.querySelector('meta[name="description"]').content = t.description;
 const routeFacts = isCare ? t.careFacts : t.studyFacts;
 const requirements = isCare ? t.careRequirements : t.studyRequirements;
 const steps = isCare ? t.careSteps : t.studySteps;
 const docs = [...t.docsCommon, ...(isCare ? t.docsCare : t.docsStudy)];
 const cards = contacts.filter(contact => contact.route === route);
 app.innerHTML = `
  <a class="skip-link" href="#main">${esc(t.skip)}</a>
  <header class="site-header"><div class="container header-inner">
   <a class="brand" href="#" aria-label="${esc(t.title)}"><span class="brand-mark">${icon('compass')}</span><span>${esc(t.title)}</span></a>
   <nav aria-label="${lang === 'de' ? 'Hauptnavigation' : 'Основная навигация'}"><a href="#wege">${esc(t.nav[0])}</a><a href="#kosten">${esc(t.nav[1])}</a><a href="#kontakte">${esc(t.nav[2])}</a></nav>
   <div class="language-switch" role="group" aria-label="${esc(t.language)}"><button id="lang-de" data-lang="de" lang="de" aria-pressed="${lang === 'de'}">DE</button><span aria-hidden="true">/</span><button id="lang-ru" data-lang="ru" lang="ru" aria-pressed="${lang === 'ru'}">РУ</button></div>
  </div></header>
  <main id="main">
   <section class="hero container" aria-labelledby="hero-title">
    <div class="hero-copy"><div class="eyebrow"><span class="small-sun" aria-hidden="true"></span>${esc(t.eyebrow)}</div>
     <h1 id="hero-title">${esc(t.hero[0])}<br><em>${esc(t.hero[1])}</em></h1>
     <p class="hero-intro">${esc(t.intro)}</p>
     <div class="hero-actions"><a href="#wege" class="button primary">${esc(t.cta)}${icon('arrow')}</a><a href="#kontakte" class="text-button">${esc(t.secondCta)}</a></div>
     <p class="reviewed">${icon('check')} ${esc(t.reviewed)}</p>
    </div>
    <div class="journey-card"><div class="card-ornament" aria-hidden="true">${icon('leaf')}</div><p class="micro-label">${esc(t.journeyLabel)}</p><h2>${esc(t.journeyTitle)}<span>${esc(t.journeySub)}</span></h2>
     <div class="journey-stops">${t.journeyStops.map(([number,title,description],index) => `<div class="journey-stop"><span class="stop-number n${index}">${number}</span><div><strong>${esc(title)}</strong><span>${esc(description)}</span></div>${icon(index === 2 ? 'check' : 'arrow')}</div>`).join('')}</div>
     <div class="journey-footer"><span class="little-star" aria-hidden="true">✳</span><p>${esc(t.journeyFooter)}</p></div>
    </div>
   </section>
   <section id="wege" class="section container" aria-labelledby="routes-heading">
    <div class="section-heading"><p class="eyebrow">${esc(t.orientation)}</p><h2 id="routes-heading">${esc(t.routesTitle)}</h2><p>${esc(t.routesIntro)}</p></div>
    <div class="route-tabs" role="tablist" aria-label="${esc(t.nav[0])}">
     <button id="tab-care" role="tab" aria-controls="route-panel" aria-selected="${isCare}" tabindex="${isCare ? 0 : -1}" data-route="care">${icon('heart')} ${esc(t.care)}</button>
     <button id="tab-study" role="tab" aria-controls="route-panel" aria-selected="${!isCare}" tabindex="${!isCare ? 0 : -1}" data-route="study">${icon('book')} ${esc(t.study)}</button>
    </div>
    <div id="route-panel" class="route-panel ${isCare ? 'care-panel' : 'study-panel'}" role="tabpanel" aria-labelledby="tab-${route}">
     <div class="route-main"><p class="micro-label">${esc(isCare ? t.careKicker : t.studyKicker)}</p><h3>${esc(isCare ? t.careTitle : t.studyTitle)}</h3><p class="route-description">${esc(isCare ? t.careText : t.studyText)}</p>
      <div class="route-facts">${routeFacts.map(([value,label]) => `<div><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('')}</div>
      <aside class="route-note"><span class="note-icon">${icon(isCare ? 'leaf' : 'book')}</span><div><h4>${esc(isCare ? t.careNoteTitle : t.studyNoteTitle)}</h4><p>${esc(isCare ? t.careNote : t.studyNote)}</p></div></aside>
      <div class="source-line">${source(isCare ? 'nursing' : 'eligibility')}${source(isCare ? 'assistant' : 'documents')}</div>
     </div>
     <div class="requirements"><h4>${esc(t.requirementsTitle)}</h4><ul>${requirements.map(text => `<li><span class="check-circle">${icon('check')}</span><span>${esc(text)}</span></li>`).join('')}</ul>
      ${isCare ? source('nursing') : external('https://www.uni-siegen.de/starting/studienvorbereitende-sprachkurse','Universität Siegen · Sprachprüfungen','source-link')}
     </div>
    </div>
    ${isCare ? `<div class="reality-note">${icon('heart')}<p><strong>${esc(t.realityTitle)}</strong> ${esc(t.realityText)}</p></div>` : ''}
   </section>
   <section class="roadmap-section"><div class="container"><div class="section-heading compact"><h2>${esc(t.roadmapTitle)}</h2><p>${esc(t.roadmapSub)}</p></div>
    <ol class="roadmap">${steps.map(([title,text],index) => `<li><span class="step-index">0${index + 1}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`).join('')}</ol>
    <div class="visa-note"><div class="visa-title">${icon('globe')}<h3>${esc(t.visaTitle)}</h3></div><div><p>${esc(t.visaText)}</p><p>${esc(isCare ? t.careVisa : t.studyVisa)}</p><div class="source-line">${source(isCare ? 'trainingMoscow' : 'studyVisa')}${source(isCare ? 'trainingVisa' : 'languageVisa')}${isCare ? source('school') : ''}</div></div></div>
   </div></section>
   <section id="kosten" class="section container" aria-labelledby="costs-heading"><div class="section-heading"><p class="eyebrow">${esc(t.costsEyebrow)}</p><h2 id="costs-heading">${esc(t.costsTitle)}</h2><p>${esc(t.costsIntro)}</p></div>
    <div class="cost-grid"><div class="money-card"><div class="money-heading"><span class="coin" aria-hidden="true">€</span><h3>${esc(isCare ? t.careCostMain : t.studyCostMain)}</h3><p>${esc(isCare ? t.careCostSub : t.studyCostSub)}</p></div>
     <h4>${esc(isCare ? t.careMoneyTitle : t.studyMoneyTitle)}</h4><dl class="money-rows">${isCare ? ['1.490,69 €','1.552,07 €','1.653,38 €'].map((value,index)=>`<div><dt>${esc(t.years[index])}</dt><dd>${value}<small>${esc(t.gross)}</small></dd></div>`).join('') : t.studyMoney.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
     <p class="fine-print">${esc(isCare ? t.payNote : t.studyMoneyNote)}</p><div class="source-line">${source(isCare ? 'pay' : 'studyVisa')}${source(isCare ? 'tuition' : 'languageMoney')}</div>
    </div><div class="expense-panel"><h3>${esc(t.expenseTitle)}</h3><div class="expenses">${t.expenses.map(([title,text],index)=>`<div><span class="expense-number">0${index+1}</span><div><h4>${esc(title)}</h4><p>${esc(text)}</p></div></div>`).join('')}</div><div class="cost-question"><p class="micro-label">${esc(t.costQuestion)}</p><blockquote>${esc(t.costQuote)}</blockquote></div><p class="fine-print">${esc(t.costNote)}</p>${source(isCare ? 'trainingVisa' : 'studyVisa')}</div></div>
   </section>
   <section class="document-section container"><div class="document-intro"><span class="section-icon">${icon('check')}</span><h2>${esc(t.documentsTitle)}</h2><p>${esc(t.documentSub)}</p><span id="check-counter" class="check-counter">${completed[route].size} / ${docs.length} ${esc(t.completed)}</span></div><div><div class="document-list">${docs.map((label,index)=>`<label class="document-item"><input type="checkbox" data-check="${index}" ${completed[route].has(index)?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div><p class="fine-print document-tip">${esc(t.docTip + ' ' + (isCare ? t.careDocTip : t.studyDocTip))}</p><div class="source-line">${source(isCare ? 'school' : 'documents')}${source('embassy')}</div></div></section>
   <section id="kontakte" class="section contacts-section" aria-labelledby="contacts-heading"><div class="container"><div class="section-heading"><p class="eyebrow">${esc(t.contactsEyebrow)}</p><h2 id="contacts-heading">${esc(t.contactsTitle)}</h2><p>${esc(t.contactsIntro)}</p></div>
    <div class="contact-heading"><span class="route-badge">${icon(isCare?'heart':'book')}${esc(isCare?t.care:t.study)}</span><span>${cards.length} ${esc(t.contactCount)}</span><a href="#wege" class="text-button">${esc(t.nav[0])} ${icon('arrow')}</a></div>
    <div class="contact-grid">${cards.map((contact,index)=> {const c=contact[lang];return `<article class="contact-card ${index===0?'featured-contact':''}"><div class="contact-top"><p class="micro-label">${esc(c.tag)}</p><span class="contact-number">${String(index+1).padStart(2,'0')}</span></div><h3>${esc(contact.name)}</h3><p class="location">${icon('pin')}${esc(contact.city)}</p><p class="contact-description">${esc(c.description)}</p><div class="contact-email"><span>${esc(contact.email)}</span><button class="icon-button" data-copy-address="${contact.id}" aria-label="${esc(t.copyEmail)}: ${esc(contact.name)}">${icon('copy')}</button></div><p class="application-note">${esc(c.application)}</p><div class="contact-actions"><button class="button small" id="mail-${contact.id}" data-mail="${contact.id}">${icon('mail')}${esc(t.prepare)}</button>${external(contact.url,t.official,'official-link')}</div></article>`;}).join('')}</div>
    <p class="contact-disclaimer">${icon('check')}${esc(t.contactNote)}</p>
   </div></section>
   <section class="faq-section container"><div class="section-heading compact"><h2>${esc(t.faqTitle)}</h2></div><div class="faq-list">${t.faqs.map(([question,answer])=>`<details><summary>${esc(question)}<span aria-hidden="true">+</span></summary><p>${esc(answer)}</p></details>`).join('')}</div></section>
   <section class="sources-section container"><div><p class="eyebrow">${lang==='de'?'TRANSPARENT & NACHVOLLZIEHBAR':'ПРОЗРАЧНО И ПРОВЕРЯЕМО'}</p><h2>${esc(t.sourcesTitle)}</h2><p>${esc(t.sourcesText)}</p><p class="source-date">${esc(t.sourceDate)}</p></div><ul>${Object.entries(sources).map(([key])=>`<li>${source(key)}</li>`).join('')}</ul></section>
  </main>
  <footer><div class="container footer-main"><div><a href="#" class="brand"><span class="brand-mark">${icon('compass')}</span><span>${esc(t.title)}</span></a><p>${esc(t.footer)}</p><p class="footer-small">${esc(t.footerSmall)}</p></div><div class="footer-actions"><button data-action="share" class="button subtle">${icon('link')}${esc(t.share)}</button><button data-action="print" class="text-button">${icon('print')}${esc(t.print)}</button></div></div></footer>`;
 if(focusId) document.getElementById(focusId)?.focus({preventScroll:true});
}

function announce(text) {
 const status = document.querySelector('#status');
 status.textContent = text;
 status.classList.add('visible');
 clearTimeout(toastTimer);
 toastTimer = setTimeout(()=>status.classList.remove('visible'),3200);
}

async function copyText(text, success=copy[lang].copied) {
 try {
  if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
  else {
   const field = document.createElement('textarea');
   field.value=text; field.className='clipboard-fallback';
   (dialog.open?dialog:document.body).append(field); field.select();
   const result=document.execCommand('copy'); field.remove();
   if(!result) throw new Error('Clipboard unavailable');
  }
  announce(success);
 } catch {
  const fallback = dialog.open ? document.querySelector('#mail-body') : null;
  fallback?.focus(); fallback?.select();
  announce(copy[lang].copyFail);
 }
}

function openInquiry(id, trigger) {
 const contact=contacts.find(item=>item.id===id);
 if(!contact) return;
 const draft=inquiry(contact); const t=copy[lang];
 lastTrigger=trigger;
 const mailto=`mailto:${contact.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
 dialog.innerHTML=`<div class="modal-header"><div><p class="eyebrow">${esc(contact.name)}</p><h2 id="mail-title">${esc(t.modalTitle)}</h2></div><button class="icon-button close-dialog" data-close aria-label="${esc(t.close)}">${icon('close')}</button></div><p class="modal-sub">${esc(t.modalSub)}</p>
 <div class="mail-field"><label for="mail-to">${esc(t.to)}</label><div><input id="mail-to" readonly value="${esc(contact.email)}"><button class="icon-button" data-copy="to" aria-label="${esc(t.copyEmail)}">${icon('copy')}</button></div></div>
 <div class="mail-field"><label for="mail-subject">${esc(t.subject)}</label><div><input id="mail-subject" readonly value="${esc(draft.subject)}"><button class="icon-button" data-copy="subject" aria-label="${esc(t.subject)} · ${esc(t.copied)}">${icon('copy')}</button></div></div>
 <div class="mail-field"><label for="mail-body">${esc(t.body)} <span lang="de">· Deutsch</span></label><textarea id="mail-body" rows="13" readonly>${esc(draft.body)}</textarea></div>
 ${lang==='ru'?`<details class="translation"><summary>${esc(t.translated)}</summary><p>${esc(draft.translation)}</p></details>`:''}
 <div class="modal-actions"><button class="button primary" data-copy="body">${icon('copy')}${esc(t.copyBody)}</button><button class="button subtle" data-copy="all">${esc(t.copyAll)}</button><a class="text-button" href="${esc(mailto)}">${esc(t.openMail)}${icon('external')}</a></div><p class="fine-print">${esc(t.emailStatus)}</p>`;
 dialog.showModal();
}

document.addEventListener('click',event=> {
 const button=event.target.closest('button');
 if(!button) return;
 if(button.dataset.lang) {lang=button.dataset.lang;updateURL();render(`lang-${lang}`);}
 if(button.dataset.route) {route=button.dataset.route;updateURL();render(`tab-${route}`);}
 if(button.dataset.mail) openInquiry(button.dataset.mail,button);
 if(button.dataset.copyAddress) {const contact=contacts.find(item=>item.id===button.dataset.copyAddress);if(contact)void copyText(contact.email);}
 if(button.hasAttribute('data-close')) dialog.close();
 if(button.dataset.copy) {
  const fields={to:document.querySelector('#mail-to')?.value,subject:document.querySelector('#mail-subject')?.value,body:document.querySelector('#mail-body')?.value};
  void copyText(button.dataset.copy==='all'?`${copy[lang].to}: ${fields.to}\n${copy[lang].subject}: ${fields.subject}\n\n${fields.body}`:fields[button.dataset.copy]);
 }
 if(button.dataset.action==='share') void copyText(location.href,copy[lang].shared);
 if(button.dataset.action==='print') window.print();
});
document.addEventListener('change',event=>{
 if(!event.target.matches('[data-check]')) return;
 const index=Number(event.target.dataset.check);
 if(event.target.checked) completed[route].add(index); else completed[route].delete(index);
 const count=copy[lang].docsCommon.length+(route==='care'?copy[lang].docsCare.length:copy[lang].docsStudy.length);
 document.querySelector('#check-counter').textContent=`${completed[route].size} / ${count} ${copy[lang].completed}`;
});
document.addEventListener('keydown',event=>{
 if(!event.target.matches('[data-route]'))return;
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 event.preventDefault(); route=event.key==='Home'?'care':event.key==='End'?'study':route==='care'?'study':'care';updateURL();render(`tab-${route}`);
});
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
});
dialog.addEventListener('close',()=>lastTrigger?.focus({preventScroll:true}));
render();

