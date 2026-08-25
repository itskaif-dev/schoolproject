
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let site=null,currentSlide=0,sliderTimer=null;

async function loadSite(){
 const r=await fetch("/api/site"); site=await r.json(); renderAll();
}
function renderAll(){
 const s=site.settings;
 $("#siteTitle").textContent=s.title; $("#siteTitleBn").textContent=s.title_bn; $("#siteSubtitle").textContent=s.subtitle;
 $("#topPhone").innerHTML=`<i class="fa-solid fa-phone"></i> ${esc(s.phone)}`;
 $("#topEmail").innerHTML=`<i class="fa-solid fa-envelope"></i> ${esc(s.email)}`;
 $("#facebookLink").href=s.facebook||"#"; $("#youtubeLink").href=s.youtube||"#";
 $("#tickerTrack").innerHTML=site.ticker.map(x=>`<span>${esc(x)}</span>`).join("");
 $("#heroSlider").innerHTML=site.hero.map((h,i)=>`<div class="hero-slide ${i===0?"active":""}"><img src="${esc(h.image)}" alt="${esc(h.title.replace(/<br>/g," "))}"></div>`).join("");
 $("#heroContent").innerHTML=heroMarkup(site.hero[0]);
 $("#sliderDots").innerHTML=site.hero.map((_,i)=>`<button class="slider-dot ${i===0?"active":""}" data-i="${i}"></button>`).join("");
 $("#statsGrid").innerHTML=site.stats.map(x=>`<div class="stat-card"><i class="fa-solid ${esc(x.icon)}"></i><h3>${esc(x.value)}</h3><p>${esc(x.label)}</p></div>`).join("");
 $("#aboutImage").src=site.about.image||"images/hero1.jpg"; $("#aboutBadge").textContent=site.about.badge; $("#aboutBadgeText").innerHTML=esc(site.about.badgeText).replace(" ","<br>");
 $("#aboutContent").innerHTML=`<span class="section-label">${esc(site.about.label)}</span><h2>${site.about.heading}</h2>${site.about.paragraphs.map(p=>`<p>${esc(p)}</p>`).join("")}<div class="about-points">${site.about.points.map(p=>`<div><i class="fa-solid fa-circle-check"></i> ${esc(p)}</div>`).join("")}</div>`;
 const t=site.tic; $("#ticCard").innerHTML=`<img src="${esc(t.image)}" alt="${esc(t.name)}"><h3>${esc(t.name)}</h3><p>${esc(t.role)}</p><small>${esc(t.degree)}</small>`;
 $("#ticContent").innerHTML=`<span class="section-label">MESSAGE FROM TIC</span><h2>${esc(t.heading)}</h2><div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>${t.paragraphs.map(p=>`<p>${esc(p)}</p>`).join("")}<p class="signature">With warm regards,<br><strong>Teacher-in-Charge</strong><br>${esc(s.title)} ${esc(s.subtitle)}</p>`;
 $("#academicsGrid").innerHTML=site.academics.map(a=>`<div class="academic-card ${a.stream?"featured":""}"><div class="academic-icon"><i class="fa-solid ${esc(a.icon)}"></i></div><h3>${esc(a.title)}</h3><span>${esc(a.classes)}</span>${a.stream?`<p class="stream">${esc(a.stream)}</p>`:""}${a.subjects?`<ul>${a.subjects.map(v=>`<li>${esc(v)}</li>`).join("")}</ul>`:`<p>${esc(a.description||"")}</p>`}</div>`).join("");
 $("#facilitiesGrid").innerHTML=site.facilities.map(f=>`<div class="facility-card"><i class="fa-solid ${esc(f.icon)}"></i><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p><strong>${esc(f.value)}</strong></div>`).join("");
 $("#teacherTic").innerHTML=`<img src="${esc(t.image)}" alt="${esc(t.name)}"><div class="teacher-info"><span>HEADMASTER (TIC)</span><h3>${esc(t.name)}</h3><p>${esc(t.degree)}</p><p>${esc(s.title)} ${esc(s.subtitle)}</p></div>`;
 const groups={}; site.teachers.forEach(x=>(groups[x.group]??=[]).push(x));
 const teacherCard=(x,i)=>`<div class="staff-card">${x.image?`<img class="staff-avatar" src="${esc(x.image)}" alt="${esc(x.name)}">`:''}<span class="staff-no">${String(i+1).padStart(2,"0")}</span><div><h4>${esc(x.name)}</h4>${x.faculty?`<p class="staff-faculty">${esc(x.faculty)}</p>`:''}<p>${esc(x.degree)}</p></div></div>`;
 $("#teacherGroups").innerHTML=Object.entries(groups).filter(([g])=>!["Computer Teacher","Guest Teacher"].includes(g)).map(([g,arr])=>`<div class="staff-group"><div class="staff-group-heading"><i class="fa-solid fa-${g.startsWith("Para")?"users":"chalkboard-user"}"></i><h3>${esc(g)}</h3></div><div class="staff-grid">${arr.map((x,i)=>teacherCard(x,i)).join("")}</div></div>`).join("")+`<div class="staff-special-grid">${site.teachers.filter(x=>["Computer Teacher","Guest Teacher"].includes(x.group)).map(x=>`<div class="special-staff-card">${x.image?`<img class="special-avatar" src="${esc(x.image)}" alt="${esc(x.name)}">`:''}<div class="special-icon"><i class="fa-solid fa-${x.group==="Computer Teacher"?"computer":"user-tie"}"></i></div><div><span>${esc(x.group)}</span><h3>${esc(x.name)}</h3>${x.faculty?`<p class="staff-faculty">${esc(x.faculty)}</p>`:''}<p>${esc(x.degree)}</p></div></div>`).join("")}</div>`;
 $("#noticesGrid").innerHTML=site.notices.map(n=>`<div class="notice-card"><div class="notice-icon"><i class="fa-solid fa-file-pdf"></i></div><div><span class="notice-date">${esc(n.date)}</span><h3>${esc(n.title)}</h3><p>${esc(n.description)}</p><a href="${esc(n.file)}" target="_blank" class="notice-link">View Notice <i class="fa-solid fa-arrow-right"></i></a></div></div>`).join("");
 $("#eventsGrid").innerHTML=site.events.map(e=>`<div class="event-item"><i class="fa-solid ${esc(e.icon)}"></i><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p></div>`).join("");
 $("#galleryGrid").innerHTML=site.gallery.map(g=>`<div class="gallery-item" data-category="${esc(g.category)}"><img src="${esc(g.image)}" alt="${esc(g.alt)}"></div>`).join("");
 $("#contactInfo").innerHTML=`<div class="contact-card"><i class="fa-solid fa-location-dot"></i><div><h3>School Address</h3><p>${esc(s.address)}</p></div></div><div class="contact-card"><i class="fa-solid fa-phone"></i><div><h3>Phone</h3><p>${esc(s.phone)}</p><p>${esc(s.phone2)}</p></div></div><div class="contact-card"><i class="fa-solid fa-envelope"></i><div><h3>Email</h3><p>${esc(s.email)}</p></div></div><div class="contact-card"><i class="fa-solid fa-school"></i><div><h3>Institution Details</h3><p>Institution Code: ${esc(s.institutionCode)}</p><p>UDISE Code: ${esc(s.udiseCode)}</p><p>H.S. Code: ${esc(s.hsCode)}</p></div></div>`;
 $("#mapFrame").src="https://www.google.com/maps?q="+encodeURIComponent(s.mapQuery)+"&output=embed";
 $("#footerBrand").innerHTML=`${esc(s.title)}<br>${esc(s.subtitle)}`; $("#footerAbout").textContent=s.footer;
 $("#footerContact").innerHTML=`<h3>Contact</h3><p><i class="fa-solid fa-location-dot"></i> ${esc(s.address)}</p><p><i class="fa-solid fa-phone"></i> ${esc(s.phone)}</p><p><i class="fa-solid fa-envelope"></i> ${esc(s.email)}</p>`;
 $("#currentYear").textContent=new Date().getFullYear();
 bindInteractions(); startSlider();
}
function heroMarkup(h){return `<span class="established">${esc(h.established)}</span><h2>${h.title}</h2><h3>${esc(h.subtitle)}</h3><p>${esc(h.text)}</p><div class="hero-buttons"><a href="#about" class="btn primary-btn">About School</a><a href="#contact" class="btn outline-btn">Contact Us</a></div>`}
function showSlide(i){const slides=$$(".hero-slide"),dots=$$(".slider-dot"); if(!slides.length)return; currentSlide=(i+slides.length)%slides.length;slides.forEach((x,n)=>x.classList.toggle("active",n===currentSlide));dots.forEach((x,n)=>x.classList.toggle("active",n===currentSlide));$("#heroContent").innerHTML=heroMarkup(site.hero[currentSlide]);}
function startSlider(){clearInterval(sliderTimer);sliderTimer=setInterval(()=>showSlide(currentSlide+1),5000)}
function bindInteractions(){
 $("#nextBtn").onclick=()=>{showSlide(currentSlide+1);startSlider()}; $("#prevBtn").onclick=()=>{showSlide(currentSlide-1);startSlider()};
 $$(".slider-dot").forEach(d=>d.onclick=()=>{showSlide(+d.dataset.i);startSlider()});
 $$(".filter-btn").forEach(b=>b.onclick=()=>{$$(".filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");const f=b.dataset.filter;$$(".gallery-item").forEach(i=>i.style.display=f==="all"||i.dataset.category===f?"block":"none")});
 $$(".gallery-item").forEach((item,i)=>item.onclick=()=>{ $("#lightboxImage").src=item.querySelector("img").src; $("#lightbox").classList.add("show"); document.body.style.overflow="hidden"; });
 $("#lightboxClose").onclick=closeLightbox; $("#lightbox").onclick=e=>{if(e.target.id==="lightbox")closeLightbox()};
 $("#menuBtn").onclick=()=>{$("#mainNav").classList.toggle("open")};
 $$("#mainNav a").forEach(a=>a.onclick=()=>$("#mainNav").classList.remove("open"));
 $("#backToTop").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
 $("#languageBtn").onclick=()=>{document.querySelectorAll(".en-text").forEach(e=>e.style.display="none");document.querySelectorAll(".bn-text").forEach(e=>e.style.display="inline");$("#languageBtn").textContent="English"};
}
function closeLightbox(){$("#lightbox").classList.remove("show");document.body.style.overflow=""}
$("#languageBtn").addEventListener("dblclick",()=>location.reload());
window.addEventListener("scroll",()=>$("#backToTop").classList.toggle("show",scrollY>500));
loadSite().catch(e=>console.error(e));
