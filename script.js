
(function(){
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenisInstance = null;
  var GOOGLE_FONTS_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

  // ============ DATA ============
  var DEFAULT_DATA = JSON.parse(document.getElementById('siteData').textContent);
  var DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
  var dataLoaded = false;
  var dataLoadPromise = null;

  // ============ DESIGN SETTINGS ============
  var DESIGN_DEFAULTS = {
    light:{bg:"#fafafa",surface:"#f4f4f5",surface2:"#e4e4e7",text:"#09090b",muted:"#71717a",border:"rgba(9,9,11,.06)",borderStrong:"rgba(9,9,11,.15)",accent:"#10b981",accentBright:"#00ff66",accentText:"#09090b",good:"#18181b",bad:"#ff3b30",neural:"#a1a1aa"},
    dark:{bg:"#050505",surface:"#0f0f10",surface2:"#1c1c1e",text:"#f4f4f5",muted:"#a1a1aa",border:"rgba(244,244,245,.08)",borderStrong:"rgba(244,244,245,.18)",accent:"#ccff00",accentBright:"#e5ff7f",accentText:"#050505",good:"#ffffff",bad:"#ff453a",neural:"#71717a"},
    neural:{speed:0.5,nodeSize:2,lineWidth:1,density:32000,maxDistance:150}
  };
  function designSettings(){
    var d = DATA.design || {};
    d.light = Object.assign({}, DESIGN_DEFAULTS.light, d.light || {});
    d.dark = Object.assign({}, DESIGN_DEFAULTS.dark, d.dark || {});
    d.neural = Object.assign({}, DESIGN_DEFAULTS.neural, d.neural || {});
    DATA.design = d;
    return d;
  }
  function applyDesignSettings(){
    var d = designSettings();
    var rootEl = document.documentElement;
    function apply(prefix, obj){
      rootEl.style.setProperty(prefix+"-bg", obj.bg);
      rootEl.style.setProperty(prefix+"-surface", obj.surface);
      rootEl.style.setProperty(prefix+"-surface-2", obj.surface2);
      rootEl.style.setProperty(prefix+"-text", obj.text);
      rootEl.style.setProperty(prefix+"-text-muted", obj.muted);
      rootEl.style.setProperty(prefix+"-border", obj.border);
      rootEl.style.setProperty(prefix+"-border-strong", obj.borderStrong);
      rootEl.style.setProperty(prefix+"-good", obj.good);
      rootEl.style.setProperty(prefix+"-bad", obj.bad);
      rootEl.style.setProperty(prefix+"-accent", obj.accent);
      rootEl.style.setProperty(prefix+"-accent-bright", obj.accentBright);
      rootEl.style.setProperty(prefix+"-accent-text", obj.accentText);
      rootEl.style.setProperty(prefix+"-accent-neural", obj.neural);
    }
    apply("--l", d.light); apply("--d", d.dark);
    // Explicit theme variables override the CSS defaults; auto mode follows system preference.
    var theme = rootEl.getAttribute("data-theme");
    var chosen = theme === "dark" ? d.dark : theme === "light" ? d.light : (window.matchMedia("(prefers-color-scheme: dark)").matches ? d.dark : d.light);
    rootEl.style.setProperty("--bg", chosen.bg);
    rootEl.style.setProperty("--surface", chosen.surface);
    rootEl.style.setProperty("--surface-2", chosen.surface2);
    rootEl.style.setProperty("--text", chosen.text);
    rootEl.style.setProperty("--text-muted", chosen.muted);
    rootEl.style.setProperty("--border", chosen.border);
    rootEl.style.setProperty("--border-strong", chosen.borderStrong);
    rootEl.style.setProperty("--good", chosen.good);
    rootEl.style.setProperty("--bad", chosen.bad);
    rootEl.style.setProperty("--accent", chosen.accent);
    rootEl.style.setProperty("--accent-bright", chosen.accentBright);
    rootEl.style.setProperty("--accent-text", chosen.accentText);
    rootEl.style.setProperty("--accentNeural", chosen.neural);
    rootEl.style.setProperty("--accent-glow", hexToRgba(chosen.accent, 0.18));
  }
  function hexToRgba(hex, alpha){
    var h = String(hex||"").replace("#","");
    if(h.length===3) h=h.split("").map(function(c){return c+c;}).join("");
    if(!/^[0-9a-fA-F]{6}$/.test(h)) return "rgba(128,128,128,"+alpha+")";
    return "rgba("+parseInt(h.slice(0,2),16)+","+parseInt(h.slice(2,4),16)+","+parseInt(h.slice(4,6),16)+","+alpha+")";
  }

  // On Netlify, the dashboard uses a serverless endpoint backed by Netlify Blobs.
  // This makes dashboard edits survive refreshes and new deployments.
  function loadSiteData(){
    if(dataLoadPromise) return dataLoadPromise;
    dataLoadPromise = fetch('/.netlify/functions/site-data', {cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('Saved site data could not be loaded (HTTP ' + r.status + ').'); return r.json(); })
      .then(function(saved){
        if(saved && saved.company){ DATA = saved; }
        designSettings();
        applyDesignSettings();
        dataLoaded = true;
      })
      .catch(function(){ dataLoaded = true; })
      .then(function(){ return DATA; });
    return dataLoadPromise;
  }
  var heroSliderTimer = null;

  // ============ HELPERS ============
  function esc(s){
    if(s === null || s === undefined) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function nl2br(s){ return esc(s).replace(/\n/g,"<br>"); }
  function videoEmbedUrl(url, opts){
    if(!url) return null;
    if(typeof window !== 'undefined' && window.location && /^file:/i.test(window.location.protocol)) return null;
    var bg = opts && opts.background;
    var u = String(url).trim();
    var yt = u.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/i);
    if(yt){
      var id = yt[1];
      if(bg) return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&mute=1&loop=1&controls=0&playlist=" + id + "&modestbranding=1&rel=0&playsinline=1&showinfo=0&iv_load_policy=3";
      return "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1";
    }
    var vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if(vm){
      if(bg) return "https://player.vimeo.com/video/" + vm[1] + "?autoplay=1&muted=1&loop=1&background=1&controls=0";
      return "https://player.vimeo.com/video/" + vm[1];
    }
    if(/^https?:\/\//.test(u)) return u;
    return null;
  }
  function heroVideoActive(){
    return !!(DATA.company.showreelEnabled && DATA.company.showreelUrl && videoEmbedUrl(DATA.company.showreelUrl));
  }
  function resizeImageToDataUrl(file, maxDim, quality, cb){
    var reader = new FileReader();
    reader.onerror = function(){ cb(null); };
    reader.onload = function(){
      // Keep SVG logos as SVG so transparency and crispness are preserved.
      if(/image\/svg\+xml/i.test(file.type)){ cb(reader.result); return; }
      var image = new Image();
      image.onerror = function(){ cb(null); };
      image.onload = function(){
        var w = image.naturalWidth, h = image.naturalHeight;
        if(w > maxDim || h > maxDim){
          if(w >= h){ h = Math.round(h * (maxDim / w)); w = maxDim; }
          else { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, w, h);
        var isPng = /png/i.test(file.type);
        try{
          cb(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : quality));
        }catch(e){ cb(null); }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function companyLogoHtml(sizeClass){
    var logo = DATA.company && DATA.company.logo;
    if(logo){
      return '<img class="brand-logo-img '+(sizeClass||'')+'" src="'+esc(logo)+'" alt="'+esc(DATA.company.name)+' logo">';
    }
    return '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="16" cy="13" r="8" fill="currentColor"/><path d="M12 24h8a1.5 1.5 0 0 1 1.5 1.5v.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-.5A1.5 1.5 0 0 1 12 24Z" fill="currentColor"/><rect x="14.5" y="22" width="3" height="3" fill="currentColor"/></svg>';
  }

  function slugify(s){
    return String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || "item";
  }
  function uniqueId(collection, base){
    var ids = DATA[collection].map(function(x){return x.id;});
    var id = base, n = 2;
    while(ids.indexOf(id) !== -1){ id = base + "-" + n; n++; }
    return id;
  }
  function findItem(collection, id){
    var arr = DATA[collection] || [];
    for(var i=0;i<arr.length;i++){ if(arr[i].id === id) return arr[i]; }
    return null;
  }
  function indexOfItem(collection, id){
    var arr = DATA[collection] || [];
    for(var i=0;i<arr.length;i++){ if(arr[i].id === id) return i; }
    return -1;
  }

  // ============ ROUTE PARSING ============
  function parseHash(){
    var h = window.location.hash.replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    return { route: parts[0] || "home", rest: parts.slice(1) };
  }

  // ============ FIELD SCHEMAS (admin CRUD) ============
  var SCHEMAS = {
    services: { label:"Service", plural:"Services", fields:[
      {key:"category", label:"Category label (e.g. SEARCH)", type:"text"},
      {key:"title", label:"Title", type:"text", required:true},
      {key:"tagline", label:"Tagline", type:"text"},
      {key:"desc", label:"Description", type:"textarea"},
      {key:"points", label:"Bullet points (one per line)", type:"lines"},
      {key:"image", label:"Header image (optional)", type:"image"}
    ], summary:function(it){ return {main: it.title, sub: it.tagline || ""}; } },
    projects: { label:"Project", plural:"Projects", fields:[
      {key:"client", label:"Client name", type:"text", required:true},
      {key:"title", label:"Project title", type:"text", required:true},
      {key:"category", label:"Category tag (e.g. Skincare · SEO + GEO)", type:"text"},
      {key:"desc", label:"Description", type:"textarea"},
      {key:"metricValue", label:"Metric value (e.g. 68%)", type:"text"},
      {key:"metricLabel", label:"Metric label", type:"text"},
      {key:"image", label:"Image (optional)", type:"image"},
      {key:"featured", label:"Show on homepage", type:"checkbox"}
    ], summary:function(it){ return {main: it.client + " — " + it.title, sub: it.category || ""}; } },
    team: { label:"Team member", plural:"Team", fields:[
      {key:"name", label:"Name", type:"text", required:true},
      {key:"role", label:"Role / title", type:"text"},
      {key:"bio", label:"Short bio", type:"textarea"},
      {key:"photo", label:"Photo (optional)", type:"image"},
      {key:"linkedin", label:"LinkedIn URL (optional)", type:"text"}
    ], summary:function(it){ return {main: it.name, sub: it.role || ""}; } },
    jobs: { label:"Job posting", plural:"Careers", fields:[
      {key:"title", label:"Job title", type:"text", required:true},
      {key:"department", label:"Department", type:"text"},
      {key:"location", label:"Location", type:"text"},
      {key:"type", label:"Employment type", type:"select", options:["Full-time","Part-time","Contract","Internship"]},
      {key:"desc", label:"Description", type:"textarea"},
      {key:"applyEmail", label:"Apply email", type:"text"},
      {key:"status", label:"Status", type:"select", options:["open","closed"]}
    ], summary:function(it){ return {main: it.title, sub: (it.department||"") + " · " + it.status}; } },
    access: { label:"Person", plural:"Dashboard access", fields:[
      {key:"name", label:"Name", type:"text", required:true},
      {key:"email", label:"Email", type:"text"},
      {key:"role", label:"Role", type:"text"},
      {key:"note", label:"Note", type:"text"}
    ], summary:function(it){ return {main: it.name, sub: it.role || ""}; } }
  };

  // ============ SHELL / RENDER (pure functions of DATA) ============
  function iconSvg(name){
    var icons = {
      search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
      answers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 18h.01M8 10a4 4 0 0 1 8 0c0 2-2 2.5-2 4.5"/><circle cx="12" cy="12" r="9"/></svg>',
      generative:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4l-.5 3h-5L9 11c-1-1-2-2-2-4a5 5 0 0 1 5-5Z"/><path d="M9.5 19h5M10 22h4"/></svg>',
      video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7 16 12l7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
      automation:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>',
      content:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>',
      ads:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l10 5V5L6 10H4a1 1 0 0 0-1 1Z"/><path d="M17 8.5a4 4 0 0 1 0 7"/></svg>',
      social:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9 15.8 7M8.2 13.1 15.8 17"/></svg>',
      email:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      brand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H18a3 3 0 0 0 3-3c0-5-4-9-9-9Z"/><circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
      web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6" fill="currentColor" stroke="none"/><circle cx="8.5" cy="6.5" r=".6" fill="currentColor" stroke="none"/></svg>',
      pr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.1-.6L3 21l1.7-5.1a8.3 8.3 0 0 1-.7-3.4A8.4 8.4 0 0 1 12.5 3.5 8.4 8.4 0 0 1 21 11.5Z"/></svg>',
      check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
    };
    return icons[name] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
  }
  function iconForService(svc){
    var map = {seo:"search", aeo:"answers", geo:"generative", video:"video", "digital-marketing":"ads", smm:"social", "content-strategy":"content", "email-marketing":"email", "ai-systems":"automation", branding:"brand", "web-design":"web", pr:"pr"};
    return iconSvg(map[svc.id] || "search");
  }

  function navServicesDropdown(){
    if(!DATA.services.length) return '<div class="nd-empty">No services yet</div>';
    var items = DATA.services.map(function(s){
      return '<a href="#/services/'+esc(s.id)+'">'+esc(s.title)+'</a>';
    }).join("");
    return items + '<a href="#/services" class="nd-all">All services &rarr;</a>';
  }

  function headerHtml(){
    return '' +
    '<header id="siteHeader">' +
      '<nav class="wrap site-nav" aria-label="Primary navigation">' +
        '<a href="#/" class="logo" aria-label="'+esc(DATA.company.name)+' home">' +
          companyLogoHtml('header-logo') + '<span class="logo-name">'+esc(DATA.company.name.split(" ")[0].toUpperCase())+'</span>' +
        '</a>' +
        '<ul class="nav-links" id="navLinks">' +
          '<li><a href="#/" data-route="home">Home</a></li>' +
          '<li class="navdrop-wrap" data-dropdown="services" id="servicesDropWrap">' +
            '<button type="button" class="navlink" data-route="services" id="servicesDropBtn" aria-expanded="false">Services <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button>' +
            '<div class="navdrop services-drop"><a href="#/services" class="navdrop-feature">All Services<span>Explore the full service stack</span></a>'+DATA.services.map(function(s){return '<a href="#/services/'+esc(s.id)+'">'+esc(s.title)+'</a>';}).join("")+'</div>' +
          '</li>' +
          '<li><a href="#/work" data-route="work">Work</a></li>' +
          '<li class="navdrop-wrap" data-dropdown="company" id="companyDropWrap">' +
            '<button type="button" class="navlink" data-route="company" id="companyDropBtn" aria-expanded="false">Company <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button>' +
            '<div class="navdrop company-drop"><a href="#/about">About<span>Who we are and how we work</span></a><a href="#/team">Team<span>The people behind the work</span></a><a href="#/careers">Careers<span>Join the studio</span></a><a href="#/testimonials">Testimonials<span>Client feedback and results</span></a></div>' +
          '</li>' +
          '<li class="navdrop-wrap" data-dropdown="resources" id="resourcesDropWrap">' +
            '<button type="button" class="navlink" data-route="resources" id="resourcesDropBtn" aria-expanded="false">Resources <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button>' +
            '<div class="navdrop resources-drop"><a href="#/resources">Resources<span>Guides, insights and playbooks</span></a><a href="#/systems">AI Growth Systems<span>Connected systems for modern growth</span></a><a href="#/tools">Growth Tools<span>Interactive audits and calculators</span></a><a href="#/configurator">Build Your System<span>Configure a growth stack</span></a></div>' +
          '</li>' +
          '<li><a href="#/contact" data-route="contact">Contact</a></li>' +
        '</ul>' +
        '<div class="nav-right">' +
          '<button class="theme-btn" id="themeToggle" aria-label="Toggle color theme" type="button">' +
            '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
            '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.6A9 9 0 1 1 11.4 3a7 7 0 0 0 9.6 9.6Z"/></svg>' +
          '</button>' +
          '<a href="#/contact" class="btn btn-primary nav-cta">Get a visibility audit</a>' +
          '<button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>' +
        '</div>' +
      '</nav>' +
      '<div class="mobile-nav" id="mobileNav">' +
        '<a href="#/" data-route="home">Home</a>' +
        '<button type="button" class="navlink" data-mobile-menu="services" data-route="services" aria-expanded="false">Services <span>+</span></button>' +
        '<div class="mn-sub" data-mobile-sub="services"><a href="#/services">All Services</a>'+DATA.services.map(function(s){return '<a href="#/services/'+esc(s.id)+'">'+esc(s.title)+'</a>';}).join("")+'</div>' +
        '<a href="#/work" data-route="work">Work</a>' +
        '<button type="button" class="navlink" data-mobile-menu="company" data-route="company" aria-expanded="false">Company <span>+</span></button>' +
        '<div class="mn-sub" data-mobile-sub="company"><a href="#/about">About</a><a href="#/team">Team</a><a href="#/careers">Careers</a><a href="#/testimonials">Testimonials</a></div>' +
        '<button type="button" class="navlink" data-mobile-menu="resources" data-route="resources" aria-expanded="false">Resources <span>+</span></button>' +
        '<div class="mn-sub" data-mobile-sub="resources"><a href="#/resources">Resources</a><a href="#/systems">AI Growth Systems</a><a href="#/tools">Growth Tools</a><a href="#/configurator">Build Your System</a></div>' +
        '<a href="#/contact" data-route="contact">Contact</a>' +
        '<a href="#/contact" class="btn btn-primary mobile-cta">Get a visibility audit →</a>' +
      '</div>' +
    '</header>';
  }

  function statRowHtml(){
    return '<div class="stat-row">' + DATA.company.stats.map(function(s){
      return '<div class="stat"><b data-count="'+esc(s.value)+'">0</b><span>'+esc(s.label)+'</span></div>';
    }).join("") + '</div>';
  }

  function heroSlides(){
    return [
      {eyebrow:"SEO &middot; AEO &middot; GEO &middot; VIDEO &middot; AI MARKETING", h1:"Visible<br>Everywhere <em>They Look.</em>", lede: DATA.company.heroSub},
      {eyebrow:"RANKINGS &middot; AI CITATIONS &middot; WATCH-TIME", h1:"Ranked. Cited.<br><em>Actually watched.</em>", lede:"Three scoreboards, one system: Google rankings climb, AI Overviews start citing you, and your video gets watched past the hook — tracked together, every week."},
      {eyebrow:"ONE TEAM &middot; FOUR CHANNELS", h1:"Stop running<br><em>four campaigns.</em>", lede:"Search, AI answers, generative chat, and video used to mean four vendors and four invoices. We run them as one funnel, with one team accountable for all of it."}
    ];
  }

  function pageHome(){
    var featured = DATA.projects.filter(function(p){return p.featured;}).slice(0,3);
    if(!featured.length) featured = DATA.projects.slice(0,3);
    var videoActive = heroVideoActive();
    var heroVideoSrc = videoActive ? videoEmbedUrl(DATA.company.showreelUrl, {background:true}) : null;
    var slides = heroSlides();
    return '' +
    '<section class="page" data-page="home">' +
      '<div class="hero' + (videoActive ? ' hero-video' : '') + '">' +
        (videoActive ? (
          '<div class="hero-video-bg" aria-hidden="true"><iframe src="'+esc(heroVideoSrc)+'" title="" tabindex="-1" allow="autoplay; encrypted-media" loading="eager"></iframe></div>' +
          '<div class="hero-video-scrim" aria-hidden="true"></div>'
        ) : '') +
        '<div class="wrap hero-grid' + (videoActive ? ' hero-grid-solo' : '') + '">' +
          '<div class="hero-slider" id="heroSlider">' +
            '<span class="eyebrow reveal" id="heroEyebrow">'+slides[0].eyebrow+'</span>' +
            '<h1 class="reveal" style="transition-delay:.08s" id="heroH1">'+slides[0].h1+'</h1>' +
            '<p class="lede reveal" style="transition-delay:.16s" id="heroLede">' + esc(slides[0].lede) + '</p>' +
            '<div class="hero-actions reveal" style="transition-delay:.24s">' +
              '<a href="#/contact" class="btn btn-primary">Get a visibility audit &rarr;</a>' +
              '<a href="#/services" class="btn btn-ghost">See our services</a>' +
            '</div>' +
            statRowHtml() +
            '<div class="hero-nav-row">' +
              '<div class="hero-dots" id="heroDots">' + slides.map(function(s,i){
                return '<button type="button" class="hero-dot'+(i===0?' active':'')+'" data-slide="'+i+'" aria-label="Go to slide '+(i+1)+'"></button>';
              }).join("") + '</div>' +
              '<div class="hero-slide-meta">' +
                '<span class="hero-slide-count" id="heroSlideCount">01 / 04</span>' +
                '<button type="button" class="hero-text-next" id="heroNext" aria-label="Next slide">Next <span aria-hidden="true">↗</span></button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (videoActive ? '' :
          '<div class="panel reveal spotlight" style="transition-delay:.2s" role="img" aria-label="Dashboard showing a client visibility report">' +
            '<div class="panel-bar"><span class="panel-dot"></span><span class="panel-dot"></span><span class="panel-dot"></span><span class="panel-title">visibility.report</span></div>' +
            '<div class="panel-body" id="panelBody">' +
              '<div class="panel-row hd"><span>BRAND: '+esc((DATA.projects[0]&&DATA.projects[0].client)||"Your Brand")+'</span><span>Q3 2026</span></div>' +
              '<div class="panel-row"></div>' +
              '<div class="panel-row"><span class="lbl">Google top-3 rankings</span><span class="val">&#9650; 340%</span></div>' +
              '<div class="panel-row"><span class="lbl">AI Overview citations</span><span class="val">12 new</span></div>' +
              '<div class="panel-row"><span class="lbl">ChatGPT / Perplexity refs</span><span class="val">28 new</span></div>' +
              '<div class="panel-row"><span class="lbl">Avg. video watch-through</span><span class="val">71%</span></div>' +
              '<div class="panel-row"><span class="lbl"><span class="live-dot"></span>tracking</span><span class="val">live</span></div>' +
            '</div>' +
          '</div>') +
        '</div>' +
      '</div>' +

      '<div class="strip"><div class="wrap"><span class="strip-label">Trusted by teams at</span><div class="strip-logos">' +
        DATA.projects.slice(0,5).map(function(p){ return '<span>'+esc(p.client.toUpperCase())+'</span>'; }).join("") +
      '</div></div></div>' +

      '<section class="process"><div class="wrap">' +
        '<div class="section-head reveal"><span class="eyebrow">HOW WE WORK</span><h2>Five stages. One funnel, not four.</h2><p>Search, AI answers, generative chat, and video used to be separate projects. We run them as one system, in order.</p></div>' +
        '<div class="process-grid">' +
          '<div class="process-sticky">' +
            '<div class="process-panel"><span class="step-no" id="panelNo">STEP 01 / 05</span><h3 id="panelTitle">We audit where you\'re actually invisible.</h3><p id="panelDesc">A full pass across Google, AI Overviews, ChatGPT, Perplexity, and your video channels — so we fix real gaps, not guesses.</p><div class="step-track" id="stepTrack"><i class="done"></i><i></i><i></i><i></i><i></i></div></div>' +
            '<div class="chip-field" aria-hidden="true">' +
              '<div class="chip" style="top:345px; left:6%;"><span class="chip-dot">'+iconSvg("search")+'</span><span><b>Citation tracking</b><span>4 LLMs, daily</span></span></div>' +
              '<div class="chip" style="top:345px; left:60%;"><span class="chip-dot">'+iconSvg("content")+'</span><span><b>SERP share</b><span>up 340% avg</span></span></div>' +
              '<div class="chip" style="top:465px; left:4%;"><span class="chip-dot">'+iconSvg("video")+'</span><span><b>Cut on schedule</b><span>weekly shorts</span></span></div>' +
              '<div class="chip" style="top:465px; left:55%;"><span class="chip-dot">'+iconSvg("answers")+'</span><span><b>Reported weekly</b><span>live dashboard</span></span></div>' +
            '</div>' +
          '</div>' +
          '<div class="process-steps" id="processSteps">' +
            '<div class="p-step" data-no="STEP 01 / 05" data-title="We audit where you\'re actually invisible." data-desc="A full pass across Google, AI Overviews, ChatGPT, Perplexity, and your video channels — so we fix real gaps, not guesses."><span class="tag">01 &mdash; AUDIT</span><h4>Find every place you\'re being skipped.</h4></div>' +
            '<div class="p-step" data-no="STEP 02 / 05" data-title="We optimize for search, answers, and chat." data-desc="Technical SEO, structured data for answer boxes, and entity work so ChatGPT and Perplexity have a reason to cite you."><span class="tag">02 &mdash; OPTIMIZE</span><h4>SEO, AEO, and GEO, tuned together.</h4></div>' +
            '<div class="p-step" data-no="STEP 03 / 05" data-title="We produce video built around retention data." data-desc="Short-form and long-form, edited around hook rate and watch-through — not just posted and hoped for."><span class="tag">03 &mdash; PRODUCE</span><h4>Content shaped by how people actually watch.</h4></div>' +
            '<div class="p-step" data-no="STEP 04 / 05" data-title="We distribute with AI systems doing the repetition." data-desc="Automated repurposing, scheduling, and ad variants — so one asset becomes a month of placements."><span class="tag">04 &mdash; DISTRIBUTE</span><h4>One piece of content, every channel.</h4></div>' +
            '<div class="p-step" data-no="STEP 05 / 05" data-title="We measure rankings, citations, and watch-through in one place." data-desc="A live dashboard tracking SERP position, LLM citations, and video performance — updated weekly, not quarterly."><span class="tag">05 &mdash; MEASURE</span><h4>One dashboard, not five logins.</h4></div>' +
          '</div>' +
        '</div>' +
      '</div></section>' +

      '<section><div class="wrap">' +
        '<div class="section-head-row reveal">' +
          '<div class="section-head"><span class="eyebrow">WHAT WE DO</span><h2>'+DATA.services.length+' disciplines, run as one.</h2><p>Each is a full service on its own page — see the full breakdown. Drag or use the arrows to browse.</p></div>' +
          '<div class="slider-nav"><button type="button" class="slider-btn" id="svcSliderPrev" aria-label="Previous services"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" class="slider-btn" id="svcSliderNext" aria-label="Next services"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button></div>' +
        '</div>' +
        '<div class="svc-slider reveal" id="svcSlider">' + DATA.services.map(function(s){
          return '<a href="#/services/'+esc(s.id)+'" class="svc-slide-card spotlight"><span class="cap-icon">'+iconForService(s)+'</span><h3>'+esc(s.title)+'</h3><p>'+esc(s.tagline)+'</p></a>';
        }).join("") + '</div>' +
      '</div></section>' +

      '<section style="padding-top:0;"><div class="wrap">' +
        '<div class="section-head reveal"><span class="eyebrow">SELECTED WORK</span><h2>Recent results.</h2><p>A few of the brands currently being found, cited, and watched.</p></div>' +
        '<div class="work-grid reveal">' + featured.map(workCardHtml).join("") + '</div>' +
      '</div></section>' +

      '<section class="quote-section"><div class="wrap"><div class="quote-box reveal"><p>&ldquo;' + esc(DATA.company.quoteHome) + '&rdquo;</p><footer>&mdash; THE ' + esc(DATA.company.name.split(" ")[0].toUpperCase()) + ' TEAM</footer></div></div></section>' +

      '<section style="padding-top:0;"><div class="wrap"><div class="cta reveal"><h2>Ready to be found everywhere, not just Google?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Get a visibility audit &rarr;</a><a href="mailto:' + esc(DATA.company.email) + '" class="cta-email">' + esc(DATA.company.email) + '</a></div></div></div></section>' +
    '</section>';
  }

  function workCardHtml(p){
    var bg = p.image ? ' style="background-image:url(\''+esc(p.image)+'\');"' : '';
    return '<a href="#/work/'+esc(p.id)+'" class="work-card spotlight"><div class="work-top"' + bg + '><span>'+esc(p.category)+'</span></div><div class="work-body"><span class="client">'+esc(p.client)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.desc)+'</p>' +
      (p.metricValue ? '<div class="work-metric"><b>'+esc(p.metricValue)+'</b><span>'+esc(p.metricLabel)+'</span></div>' : '') +
    '</div></a>';
  }

  function pageServicesIndex(){
    return '<section class="page" data-page="services">' +
      '<div class="wrap page-hero"><span class="eyebrow reveal">SERVICES</span><h1 class="reveal">'+DATA.services.length+' disciplines. One system.</h1><p class="lede reveal">Most agencies pick one or two channels. We run all of them together, because your audience doesn\'t experience your brand one channel at a time. Pick a service below for the full breakdown.</p></div>' +
      '<div class="wrap" style="padding-bottom:110px;"><div class="cap-grid reveal">' + (DATA.services.length ? DATA.services.map(function(s){
        return '<a href="#/services/'+esc(s.id)+'" class="cap-card spotlight"><span class="cap-icon">'+iconForService(s)+'</span><h3>'+esc(s.title)+'</h3><p>'+esc(s.tagline)+'</p></a>';
      }).join("") : '<div class="admin-empty">No services added yet.</div>') + '</div></div>' +
      '<div class="wrap"><div class="cta reveal"><h2>Not sure which of these you actually need?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Get a visibility audit &rarr;</a><a href="mailto:'+esc(DATA.company.email)+'" class="cta-email">'+esc(DATA.company.email)+'</a></div></div></div>' +
    '</section>';
  }

  function serviceDetailHtml(id){
    var s = findItem("services", id);
    if(!s){
      return '<section class="page" data-page="services">' +
        '<div class="wrap page-hero"><span class="eyebrow reveal">SERVICES</span><h1 class="reveal">We couldn\'t find that service.</h1><p class="lede reveal">It may have been renamed or removed.</p><a href="#/services" class="btn btn-primary" style="margin-top:8px;">See all services &rarr;</a></div>' +
      '</section>';
    }
    var heroStyle = s.image ? ' style="background-image:linear-gradient(180deg, rgba(0,0,0,.18), var(--bg) 94%), url(\''+esc(s.image)+'\');background-size:cover;background-position:center;"' : '';
    var others = DATA.services.filter(function(x){ return x.id !== id; }).slice(0,3);
    return '<section class="page" data-page="services">' +
      '<div class="detail-hero'+(s.image?' has-img':'')+'"'+heroStyle+'><div class="wrap">' +
        '<a href="#/services" class="detail-back">&larr; All services</a>' +
        '<span class="cap-icon detail-hero-icon">'+iconForService(s)+'</span>' +
        '<span class="eyebrow reveal">'+esc(s.category||"SERVICE")+'</span>' +
        '<h1 class="reveal">'+esc(s.title)+'</h1>' +
        '<p class="lede reveal">'+esc(s.tagline)+'</p>' +
      '</div></div>' +
      '<div class="wrap"><div class="detail-grid">' +
        '<div class="detail-main reveal"><p class="detail-desc">'+esc(s.desc)+'</p>' +
          ((s.points && s.points.length) ? '<div class="svc-includes"><h3>What\'s included</h3><div class="svc-points-grid">' + s.points.map(function(pt){
            return '<div class="svc-point spotlight"><span class="check">'+iconSvg("check")+'</span><span>'+esc(pt)+'</span></div>';
          }).join("") + '</div></div>' : '') +
        '</div>' +
        '<aside class="detail-aside reveal">' +
          '<div class="svc-process"><h4>How we run it</h4><ol>' +
            '<li><b>Audit</b><span>Baseline where you stand today, before touching anything.</span></li>' +
            '<li><b>Execute</b><span>Ship the work against a plan, not a guess.</span></li>' +
            '<li><b>Report</b><span>Track it on the same dashboard as everything else.</span></li>' +
          '</ol></div>' +
          '<div class="detail-cta-card"><p>Ready to talk about '+esc(s.title.toLowerCase())+'?</p><a href="#/contact" class="btn btn-primary" style="width:100%;justify-content:center;">Get a visibility audit &rarr;</a></div>' +
        '</aside>' +
      '</div></div>' +
      (others.length ? '<div class="wrap" style="padding-top:0;padding-bottom:110px;"><div class="section-head reveal"><span class="eyebrow">MORE SERVICES</span><h2>Pairs well with '+esc(s.title)+'.</h2></div><div class="cap-grid reveal">' +
        others.map(function(o){ return '<a href="#/services/'+esc(o.id)+'" class="cap-card spotlight"><span class="cap-icon">'+iconForService(o)+'</span><h3>'+esc(o.title)+'</h3><p>'+esc(o.tagline)+'</p></a>'; }).join("") +
      '</div></div>' : '') +
      '<div class="wrap"><div class="cta reveal"><h2>Not sure this is the right fit?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Talk to us &rarr;</a><a href="mailto:'+esc(DATA.company.email)+'" class="cta-email">'+esc(DATA.company.email)+'</a></div></div></div>' +
    '</section>';
  }

  function pageWorkIndex(){
    return '<section class="page" data-page="work">' +
      '<div class="wrap page-hero"><span class="eyebrow reveal">SELECTED WORK</span><h1 class="reveal">Brands being found, cited, and watched.</h1><p class="lede reveal">A sample of recent engagements across search, AI answers, generative chat, and video. Click any project for the full story.</p></div>' +
      '<div class="wrap" style="padding-bottom:110px;"><div class="work-grid two reveal">' +
        (DATA.projects.length ? DATA.projects.map(workCardHtml).join("") : '<div class="admin-empty">No projects added yet.</div>') +
      '</div></div>' +
      '<div class="wrap"><div class="cta reveal"><h2>Want results like these for your brand?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Start a project &rarr;</a><a href="mailto:'+esc(DATA.company.email)+'" class="cta-email">'+esc(DATA.company.email)+'</a></div></div></div>' +
    '</section>';
  }

  function workDetailHtml(id){
    var p = findItem("projects", id);
    if(!p){
      return '<section class="page" data-page="work">' +
        '<div class="wrap page-hero"><span class="eyebrow reveal">WORK</span><h1 class="reveal">We couldn\'t find that project.</h1><p class="lede reveal">It may have been renamed or removed.</p><a href="#/work" class="btn btn-primary" style="margin-top:8px;">See all work &rarr;</a></div>' +
      '</section>';
    }
    var heroStyle = p.image ? ' style="background-image:linear-gradient(180deg, rgba(0,0,0,.18), var(--bg) 94%), url(\''+esc(p.image)+'\');background-size:cover;background-position:center;"' : '';
    var others = DATA.projects.filter(function(x){ return x.id !== id; }).slice(0,3);
    return '<section class="page" data-page="work">' +
      '<div class="detail-hero'+(p.image?' has-img':'')+'"'+heroStyle+'><div class="wrap">' +
        '<a href="#/work" class="detail-back">&larr; All work</a>' +
        '<span class="eyebrow reveal">'+esc(p.category||"CASE STUDY")+'</span>' +
        '<h1 class="reveal">'+esc(p.title)+'</h1>' +
        '<p class="lede reveal">Client: '+esc(p.client)+'</p>' +
      '</div></div>' +
      '<div class="wrap"><div class="detail-grid">' +
        '<div class="detail-main reveal">' +
          (p.metricValue ? '<div class="detail-metric-big"><b>'+esc(p.metricValue)+'</b><span>'+esc(p.metricLabel)+'</span></div>' : '') +
          '<p class="detail-desc">'+esc(p.desc)+'</p>' +
          '</div>' +
        '<aside class="detail-aside reveal">' +
          '<div class="detail-facts"><h4>Project facts</h4>' +
            '<div class="fact-row"><span>Client</span><b>'+esc(p.client)+'</b></div>' +
            '<div class="fact-row"><span>Category</span><b>'+esc(p.category||"—")+'</b></div>' +
            (p.metricValue ? '<div class="fact-row"><span>Result</span><b>'+esc(p.metricValue)+'</b></div>' : "") +
          '</div>' +
          '<div class="detail-cta-card"><p>Want results like this for your brand?</p><a href="#/contact" class="btn btn-primary" style="width:100%;justify-content:center;">Start a project &rarr;</a></div>' +
        '</aside>' +
      '</div></div>' +
      (others.length ? '<div class="wrap" style="padding-top:0;padding-bottom:110px;"><div class="section-head reveal"><span class="eyebrow">MORE WORK</span><h2>Other recent results.</h2></div><div class="work-grid reveal">' +
        others.map(workCardHtml).join("") +
      '</div></div>' : "") +
      '<div class="wrap"><div class="cta reveal"><h2>Want results like these for your brand?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Start a project &rarr;</a><a href="mailto:'+esc(DATA.company.email)+'" class="cta-email">'+esc(DATA.company.email)+'</a></div></div></div>' +
    '</section>';
  }

  function teamCardHtml(t){
    var initials = esc((t.name||"?").split(" ").map(function(w){return w[0]||"";}).join("").slice(0,2).toUpperCase());
    var photo = t.photo ? ' style="background-image:url(\''+esc(t.photo)+'\');"' : '';
    return '<div class="team-card spotlight reveal"><div class="team-photo"' + photo + '>' + (t.photo ? '' : initials) + '</div><h3>'+esc(t.name)+'</h3><div class="role">'+esc(t.role)+'</div><p>'+esc(t.bio)+'</p>' +
      (t.linkedin ? '<a class="li-link" href="'+esc(t.linkedin)+'" target="_blank" rel="noopener">LinkedIn &rarr;</a>' : '') +
    '</div>';
  }

  function pageTeam(){
    return '<section class="page" data-page="team">' +
      '<div class="wrap page-hero"><span class="eyebrow reveal">THE TEAM</span><h1 class="reveal">Who\'s behind the reports.</h1><p class="lede reveal">A small team running SEO, AEO, GEO, video, and automation as one system.</p></div>' +
      '<div class="wrap" style="padding-bottom:110px;"><div class="team-grid">' +
        (DATA.team.length ? DATA.team.map(teamCardHtml).join("") : '<div class="admin-empty">No team members added yet.</div>') +
      '</div></div>' +
      '<div class="wrap"><div class="cta reveal"><h2>Want to work with us directly?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Get in touch &rarr;</a><a href="#/careers" class="cta-email">Or see open roles &rarr;</a></div></div></div>' +
    '</section>';
  }

  function jobCardHtml(j){
    return '<div class="job-card spotlight reveal"><div class="job-info"><h3>'+esc(j.title)+'</h3><div class="job-meta"><span>'+esc(j.department)+'</span><span>'+esc(j.location)+'</span><span>'+esc(j.type)+'</span></div><p class="job-desc">'+esc(j.desc)+'</p></div><a class="btn btn-ghost btn-sm" href="mailto:'+esc(j.applyEmail)+'?subject='+encodeURIComponent("Application: "+j.title)+'">Apply &rarr;</a></div>';
  }

  function pageCareers(){
    var open = DATA.jobs.filter(function(j){return j.status === "open";});
    return '<section class="page" data-page="careers">' +
      '<div class="wrap page-hero"><span class="eyebrow reveal">CAREERS</span><h1 class="reveal">Come run visibility with us.</h1><p class="lede reveal">Open roles across search, production, and engineering. Don\'t see a fit? Email us anyway.</p></div>' +
      '<div class="wrap" style="padding-bottom:110px;"><div class="job-list">' +
        (open.length ? open.map(jobCardHtml).join("") : '<div class="job-empty">No open roles right now — check back soon, or email us your resume anyway.</div>') +
      '</div></div>' +
      '<div class="wrap"><div class="cta reveal"><h2>Don\'t see the right role?</h2><div class="cta-side"><a href="mailto:'+esc(DATA.company.email)+'" class="btn btn-primary">Email your resume &rarr;</a></div></div></div>' +
    '</section>';
  }

  function pageAbout(){
    return '<section class="page" data-page="about">' +
      '<div class="wrap page-hero"><span class="eyebrow reveal">ABOUT '+esc(DATA.company.name.toUpperCase())+'</span><h1 class="reveal">Discovery stopped being one channel.</h1><p class="lede reveal">People now find brands through a blend of Google, AI Overviews, ChatGPT, Perplexity, and their video feed — often in the same afternoon. Most agencies still specialize in exactly one of those. We built '+esc(DATA.company.name.split(" ")[0])+' around all four, on purpose.</p></div>' +
      '<div class="wrap" style="padding-bottom:0;"><div class="quote-box reveal"><p>&ldquo;'+esc(DATA.company.quoteAbout)+'&rdquo;</p><footer>&mdash; THE '+esc(DATA.company.name.split(" ")[0].toUpperCase())+' TEAM</footer></div></div>' +
      '<section><div class="wrap">' +
        '<div class="section-head reveal"><span class="eyebrow">WHAT WE VALUE</span><h2>How we work, in practice.</h2></div>' +
        '<div class="value-grid reveal">' +
          '<div class="value-card spotlight"><span class="n">01</span><h3>Data over hunches</h3><p>Every editing and optimization decision traces back to a ranking, citation, or retention number — not a feeling about what "looks right."</p></div>' +
          '<div class="value-card spotlight"><span class="n">02</span><h3>One system, not five vendors</h3><p>SEO, AEO, GEO, video, and automation are planned together from week one, so they compound instead of competing for the same content.</p></div>' +
          '<div class="value-card spotlight"><span class="n">03</span><h3>Visible reporting, always</h3><p>A live dashboard tracks rankings, LLM citations, and watch-through — you never have to ask what\'s happening this month.</p></div>' +
          '<div class="value-card spotlight"><span class="n">04</span><h3>Automation with a leash</h3><p>AI handles the repetitive work; every piece of brand-facing copy and creative still gets a human pass before it ships.</p></div>' +
        '</div>' +
      '</div></section>' +
      '<div class="wrap"><div class="cta reveal"><h2>Curious how we\'d approach your brand?</h2><div class="cta-side"><a href="#/contact" class="btn btn-primary">Get a visibility audit &rarr;</a><a href="mailto:'+esc(DATA.company.email)+'" class="cta-email">'+esc(DATA.company.email)+'</a></div></div></div>' +
    '</section>';
  }

  function pageContact(){
    return '<section class="page" data-page="contact">' +
      '<div class="wrap page-hero" style="padding-bottom:0;"><span class="eyebrow reveal">CONTACT</span><h1 class="reveal">Let\'s map your visibility gaps.</h1><p class="lede reveal">Tell us about your brand and where you think you\'re being missed — Google, AI answers, generative chat, or video. We\'ll reply within '+esc((DATA.company.responseTime||"a few days").toLowerCase())+'.</p></div>' +
      '<div class="wrap"><div class="contact-grid">' +
        '<div class="contact-info reveal">' +
          '<div class="info-row"><span>Email</span><a href="mailto:'+esc(DATA.company.email)+'">'+esc(DATA.company.email)+'</a></div>' +
          '<div class="info-row"><span>Phone</span><a href="tel:'+esc((DATA.company.phone||"").replace(/[^+\d]/g,""))+'">'+esc(DATA.company.phone)+'</a></div>' +
          '<div class="info-row"><span>Studio</span><p>'+esc(DATA.company.address)+'</p></div>' +
          '<div class="info-row"><span>Response time</span><p>'+esc(DATA.company.responseTime)+'</p></div>' +
          '<div class="info-row"><span>Elsewhere</span><p>' +
            (DATA.company.social.linkedin ? '<a href="'+esc(DATA.company.social.linkedin)+'" target="_blank" rel="noopener">LinkedIn</a> &middot; ' : '') +
            (DATA.company.social.instagram ? '<a href="'+esc(DATA.company.social.instagram)+'" target="_blank" rel="noopener">Instagram</a> &middot; ' : '') +
            (DATA.company.social.youtube ? '<a href="'+esc(DATA.company.social.youtube)+'" target="_blank" rel="noopener">YouTube</a>' : '') +
          '</p></div>' +
        '</div>' +
        '<form class="form-card reveal" id="contactForm" name="contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field">' +
          '<input type="hidden" name="form-name" value="contact">' +
          '<div class="form-row"><div class="field"><label for="fName">Name</label><input id="fName" name="name" type="text" placeholder="Jordan Lee" required></div><div class="field"><label for="fEmail">Email</label><input id="fEmail" name="email" type="email" placeholder="jordan@brand.com" required></div></div>' +
          '<div class="form-row"><div class="field full"><label for="fWebsite">Website</label><input id="fWebsite" name="website" type="text" placeholder="yourbrand.com"></div></div>' +
          '<div class="form-row"><div class="field full"><label>What do you need help with?</label><div class="check-grid">' +
            DATA.services.map(function(s){ return '<label class="check-item"><input type="checkbox" name="services[]" value="'+esc(s.title)+'">'+esc(s.title)+'</label>'; }).join("") +
          '</div></div></div>' +
          '<div class="form-row"><div class="field full"><label for="fMessage">A little about your brand</label><textarea id="fMessage" name="message" placeholder="What you sell, who you sell to, and where you feel invisible right now." required></textarea></div></div>' +
          '<p style="position:absolute;overflow:hidden;clip:rect(0 0 0 0);height:1px;width:1px;margin:-1px;padding:0;border:0;"><label>Don\'t fill this out if you\'re human: <input name="bot-field" type="text" tabindex="-1" autocomplete="off"></label></p>' +
          '<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">Send &rarr;</button>' +
          '<p class="form-note">Your message is securely submitted through Netlify Forms. We\'ll get back to you as soon as possible.</p>' +
          '<p class="form-success" id="formSuccess"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Thanks — your message has been sent. We\'ll be in touch soon.</p>' +
          '<p class="form-error" id="formError" style="display:none;">Sorry, something went wrong. Please try again or email us directly.</p>' +
        '</form>' +
      '</div></div>' +
    '</section>';
  }

  // ============ ADMIN ============
  function fieldInputHtml(f, val){
    var v = val === undefined || val === null ? "" : val;
    if(f.type === "textarea"){
      return '<div class="field full"><label>'+esc(f.label)+'</label><textarea data-field="'+f.key+'">'+esc(v)+'</textarea></div>';
    }
    if(f.type === "lines"){
      return '<div class="field full"><label>'+esc(f.label)+'</label><textarea data-field="'+f.key+'" data-lines="1">'+esc((v||[]).join("\n"))+'</textarea></div>';
    }
    if(f.type === "select"){
      return '<div class="field"><label>'+esc(f.label)+'</label><select data-field="'+f.key+'">' +
        f.options.map(function(o){ return '<option value="'+esc(o)+'"'+(o===v?' selected':'')+'>'+esc(o)+'</option>'; }).join("") +
      '</select></div>';
    }
    if(f.type === "checkbox"){
      return '<div class="checkbox-row"><input type="checkbox" data-field="'+f.key+'" id="cb-'+f.key+'" '+(v?'checked':'')+'><label for="cb-'+f.key+'">'+esc(f.label)+'</label></div>';
    }
    if(f.type === "image"){
      return '<div class="field full img-field">' +
        '<label>'+esc(f.label)+'</label>' +
        '<input type="hidden" data-field="'+f.key+'" value="'+esc(v)+'">' +
        '<div class="img-upload-row">' +
          '<label class="btn btn-ghost btn-sm img-upload-btn">'+(v?"Replace image":"Upload image")+'<input type="file" accept="image/*" class="img-file-input" data-imgfield="'+f.key+'" hidden></label>' +
          '<button type="button" class="btn btn-ghost btn-sm img-clear-btn" data-imgclear="'+f.key+'"'+(v?'':' hidden')+'>Remove</button>' +
          '<span class="img-upload-status"></span>' +
        '</div>' +
        '<span class="field-hint">Pasted web links can&rsquo;t be shown here &mdash; upload the image file itself and it&rsquo;s stored right in the page.</span>' +
        '<div class="img-preview-wrap"'+(v?'':' hidden')+'><img class="img-preview" src="'+esc(v)+'" alt=""></div>' +
      '</div>';
    }
    return '<div class="field'+(f.type==="text"&&(f.key==="desc")?" full":"")+'"><label>'+esc(f.label)+'</label><input type="text" data-field="'+f.key+'" value="'+esc(v)+'"'+(f.required?' required':'')+'></div>';
  }

  function itemFormHtml(collectionKey, item){
    var schema = SCHEMAS[collectionKey];
    var isNew = !item;
    var rows = schema.fields.map(function(f){
      return fieldInputHtml(f, item ? item[f.key] : "");
    }).join("");
    return '' +
      '<div class="admin-form-card reveal">' +
        '<h3>'+(isNew?"Add "+esc(schema.label.toLowerCase()):"Edit "+esc(schema.label.toLowerCase()))+'</h3>' +
        '<form id="itemForm" data-collection="'+collectionKey+'" data-id="'+(item?esc(item.id):"")+'">' +
          '<div class="form-row" style="grid-template-columns:1fr;">'+rows+'</div>' +
          '<div class="admin-form-actions">' +
            '<button type="submit" class="btn btn-primary btn-sm">'+(isNew?"Add":"Save changes")+'</button>' +
            '<a href="#/admin/'+collectionKey+'" class="btn btn-ghost btn-sm">Cancel</a>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function adminListHtml(collectionKey){
    var schema = SCHEMAS[collectionKey];
    var items = DATA[collectionKey];
    var rows = items.length ? items.map(function(it, i){
      var s = schema.summary(it);
      var badge = "";
      if(collectionKey === "jobs"){ badge = ' <span class="badge '+(it.status==="open"?"badge-open":"badge-closed")+'">'+esc(it.status)+'</span>'; }
      return '<div class="admin-row" data-id="'+esc(it.id)+'">' +
        '<div class="ar-main"><b>'+esc(s.main)+badge+'</b><span>'+esc(s.sub)+'</span></div>' +
        '<div class="ar-actions">' +
          (i>0 ? '<button type="button" class="icon-btn ar-move" data-dir="-1" title="Move up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' : '') +
          (i<items.length-1 ? '<button type="button" class="icon-btn ar-move" data-dir="1" title="Move down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></button>' : '') +
          '<a class="icon-btn" href="#/admin/'+collectionKey+'/edit/'+esc(it.id)+'" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></a>' +
          '<button type="button" class="icon-btn ar-delete" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>' +
        '</div>' +
      '</div>';
    }).join("") : '<div class="admin-empty">No '+esc(schema.plural.toLowerCase())+' yet — add the first one below.</div>';
    return '<div class="admin-list">'+rows+'</div><a href="#/admin/'+collectionKey+'/new" class="btn btn-primary btn-sm">+ Add '+esc(schema.label.toLowerCase())+'</a>' +
      (collectionKey === "services" ? '<p class="form-note" style="margin-top:14px;">New services appear automatically in the Services menu and page — no code changes needed.</p>' : "");
  }

  function companyFormHtml(){
    var c = DATA.company;
    designSettings();
    c.design = DATA.design;
    function colorInp(label,key,val){ return '<div class="color-field"><label>'+esc(label)+'</label><div><input type="color" data-design-field="'+esc(key)+'" value="'+esc(val)+'"><input type="text" data-design-field="'+esc(key)+'" value="'+esc(val)+'"></div></div>'; }
    function rangeInp(label,key,val,min,max,step){ return '<div class="field range-field"><label>'+esc(label)+' <output>'+esc(val)+'</output></label><input type="range" data-design-field="'+esc(key)+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(val)+'"></div>'; }
    function inp(label, key, val, type){
      return '<div class="field"><label>'+esc(label)+'</label><input type="'+(type||"text")+'" data-cfield="'+key+'" value="'+esc(val)+'"></div>';
    }
    function ta(label, key, val){
      return '<div class="field full"><label>'+esc(label)+'</label><textarea data-cfield="'+key+'">'+esc(val)+'</textarea></div>';
    }
    function toggleField(label, key, val, hint){
      return '<div class="field toggle-field"><label class="toggle-switch"><input type="checkbox" data-ctoggle="'+key+'"'+(val?' checked':'')+'><span class="toggle-track"><span class="toggle-thumb"></span></span><span class="toggle-label">'+esc(label)+'</span></label>' +
        (hint ? '<span class="field-hint">'+esc(hint)+'</span>' : '') + '</div>';
    }
    var statsRows = c.stats.map(function(s,i){
      return '<div class="form-row"><div class="field"><label>Stat '+(i+1)+' value</label><input type="text" data-stat-value="'+i+'" value="'+esc(s.value)+'"></div><div class="field"><label>Stat '+(i+1)+' label</label><input type="text" data-stat-label="'+i+'" value="'+esc(s.label)+'"></div></div>';
    }).join("");
    return '' +
    '<form id="companyForm" class="admin-form-card reveal">' +
      '<h3>Company info</h3>' +
      '<div class="form-row"><div class="field full img-field logo-field">' +
        '<label>Company logo</label>' +
        '<input type="hidden" data-cfield="logo" value="'+esc(c.logo||'')+'">' +
        '<div class="img-upload-row">' +
          '<label class="btn btn-ghost btn-sm img-upload-btn">'+(c.logo?'Replace logo':'Upload logo')+'<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="company-logo-input" hidden></label>' +
          '<button type="button" class="btn btn-ghost btn-sm company-logo-clear"'+(c.logo?'':' hidden')+'>Remove</button>' +
          '<span class="img-upload-status"></span>' +
        '</div>' +
        '<span class="field-hint">Upload a PNG, JPG, WebP, or SVG. The logo is stored in the page and appears in the site header and footer after publishing.</span>' +
        '<div class="img-preview-wrap"'+(c.logo?'':' hidden')+'><img class="img-preview" src="'+esc(c.logo||'')+'" alt="Company logo preview"></div>' +
      '</div></div>' +
      '<div class="form-row">' + inp("Company name","name",c.name) + inp("Support email","email",c.email,"text") + '</div>' +
      '<div class="form-row">' + inp("Phone number","phone",c.phone) + inp("Careers / response time","responseTime",c.responseTime) + '</div>' +
      '<div class="form-row">' + ta("Address / studio line","address",c.address) + '</div>' +
      '<div class="form-row">' + ta("Homepage tagline","tagline",c.tagline) + '</div>' +
      '<div class="form-row">' + ta("Homepage subheading","heroSub",c.heroSub) + '</div>' +
      '<div class="form-row">' + ta("Homepage quote","quoteHome",c.quoteHome) + '</div>' +
      '<div class="form-row">' + ta("About page quote","quoteAbout",c.quoteAbout) + '</div>' +
      '<div class="form-row">' + inp("Showreel video URL (YouTube or Vimeo link)","showreelUrl",c.showreelUrl) + toggleField("Play as homepage banner background", "showreelEnabled", c.showreelEnabled, "When on, the video autoplays muted behind the hero text. When off, the hero looks exactly as it does now.") + '</div>' +
      '<div class="form-row">' + inp("LinkedIn URL","social.linkedin",c.social.linkedin) + inp("Instagram URL","social.instagram",c.social.instagram) + '</div>' +
      '<div class="form-row">' + inp("YouTube URL","social.youtube",c.social.youtube) + inp("Admin PIN","adminPin",c.adminPin) + '</div>' +
      '<div class="admin-section-divider"><span>Theme &amp; neural background</span></div>' +
      '<div class="design-grid">' +
        '<div class="design-card"><h4>Light theme</h4>' +
          colorInp("Background","light.bg",c.design.light.bg) + colorInp("Surface","light.surface",c.design.light.surface) + colorInp("Cards / surface 2","light.surface2",c.design.light.surface2) + colorInp("Text","light.text",c.design.light.text) + colorInp("Muted text","light.muted",c.design.light.muted) + colorInp("Borders","light.border",c.design.light.border) + colorInp("Strong borders","light.borderStrong",c.design.light.borderStrong) + colorInp("Positive","light.good",c.design.light.good) + colorInp("Error","light.bad",c.design.light.bad) + colorInp("Accent","light.accent",c.design.light.accent) + colorInp("Accent bright","light.accentBright",c.design.light.accentBright) + colorInp("Button text","light.accentText",c.design.light.accentText) + colorInp("Neural nodes / lines","light.neural",c.design.light.neural) +
        '</div>' +
        '<div class="design-card"><h4>Dark theme</h4>' +
          colorInp("Background","dark.bg",c.design.dark.bg) + colorInp("Surface","dark.surface",c.design.dark.surface) + colorInp("Cards / surface 2","dark.surface2",c.design.dark.surface2) + colorInp("Text","dark.text",c.design.dark.text) + colorInp("Muted text","dark.muted",c.design.dark.muted) + colorInp("Borders","dark.border",c.design.dark.border) + colorInp("Strong borders","dark.borderStrong",c.design.dark.borderStrong) + colorInp("Positive","dark.good",c.design.dark.good) + colorInp("Error","dark.bad",c.design.dark.bad) + colorInp("Accent","dark.accent",c.design.dark.accent) + colorInp("Accent bright","dark.accentBright",c.design.dark.accentBright) + colorInp("Button text","dark.accentText",c.design.dark.accentText) + colorInp("Neural nodes / lines","dark.neural",c.design.dark.neural) +
        '</div>' +
      '</div>' +
      '<div class="form-row neural-settings-row">' +
        rangeInp("Neural speed","neural.speed",c.design.neural.speed,0,2,0.05) + rangeInp("Node size","neural.nodeSize",c.design.neural.nodeSize,0.5,6,0.5) + rangeInp("Line width","neural.lineWidth",c.design.neural.lineWidth,0.25,4,0.25) + rangeInp("Node density","neural.density",c.design.neural.density,10000,70000,1000) + rangeInp("Connection distance","neural.maxDistance",c.design.neural.maxDistance,60,260,5) +
      '</div>' +
      statsRows +
      '<div class="admin-form-actions"><button type="submit" class="btn btn-primary btn-sm">Save company info</button></div>' +
    '</form>';
  }

  var ADMIN_TABS = [
    {key:"overview", label:"Overview"},
    {key:"company", label:"Company"},
    {key:"services", label:"Services"},
    {key:"projects", label:"Projects"},
    {key:"team", label:"Team"},
    {key:"jobs", label:"Careers / Jobs"},
    {key:"access", label:"Dashboard access"}
  ];

  function adminOverviewHtml(){
    return '<div class="admin-list">' +
      '<div class="admin-row"><div class="ar-main"><b>'+DATA.services.length+' services</b><span>Shown on the Services page & nav menu</span></div><div class="ar-actions"><a href="#/admin/services" class="btn btn-ghost btn-sm">Manage</a></div></div>' +
      '<div class="admin-row"><div class="ar-main"><b>'+DATA.projects.length+' projects</b><span>Case studies on the Work page</span></div><div class="ar-actions"><a href="#/admin/projects" class="btn btn-ghost btn-sm">Manage</a></div></div>' +
      '<div class="admin-row"><div class="ar-main"><b>'+DATA.team.length+' team members</b><span>Shown on the Team page</span></div><div class="ar-actions"><a href="#/admin/team" class="btn btn-ghost btn-sm">Manage</a></div></div>' +
      '<div class="admin-row"><div class="ar-main"><b>'+DATA.jobs.filter(function(j){return j.status==="open";}).length+' open roles</b><span>of '+DATA.jobs.length+' total postings</span></div><div class="ar-actions"><a href="#/admin/jobs" class="btn btn-ghost btn-sm">Manage</a></div></div>' +
    '</div>' +
    '<div class="admin-form-card" style="margin-top:22px;">' +
      '<h3>How saving works</h3>' +
      '<p style="color:var(--text-muted);font-size:14px;line-height:1.7;">Saving any item (or company info) here publishes it live automatically — every visitor sees it within moments, no separate step needed. The <b>Save &amp; Publish</b> button at the top is only there as a manual fallback. Only people you\'ve given &ldquo;can edit&rdquo; access to (via this page\'s own Share button, top right) are able to publish; everyone else can open <code>#/admin</code> but their save attempts will be rejected. There\'s no separate login system — access is controlled by Claude\'s sharing permissions on this artifact, not by the PIN screen, which is just a convenience gate to keep casual visitors out of the dashboard UI.</p>' +
    '</div>';
  }

  function pageAdmin(){
    var parsed = parseHash();
    var tab = parsed.rest[0] || "overview";
    var mode = parsed.rest[1]; // new | edit
    var itemId = parsed.rest[2];
    var body = "";

    if(tab === "overview"){
      body = adminOverviewHtml();
    } else if(tab === "company"){
      body = companyFormHtml();
    } else if(SCHEMAS[tab]){
      if(mode === "new"){
        body = itemFormHtml(tab, null);
      } else if(mode === "edit" && itemId){
        var item = findItem(tab, itemId);
        body = item ? itemFormHtml(tab, item) : '<div class="admin-empty">Item not found.</div>';
      } else {
        body = adminListHtml(tab);
      }
    } else {
      tab = "overview";
      body = adminOverviewHtml();
    }

    var tabsHtml = ADMIN_TABS.map(function(t){
      return '<a href="#/admin/'+t.key+'" class="admin-tab'+(t.key===tab?" current":"")+'">'+esc(t.label)+'</a>';
    }).join("");

    return '<section class="page" data-page="admin">' +
      '<div class="wrap admin-wrap">' +
        '<div class="admin-top">' +
          '<div><span class="eyebrow">ADMIN DASHBOARD</span><h1>Edit '+esc(DATA.company.name)+'</h1></div>' +
          '<div class="save-row">' +
            '<span class="save-status" id="saveStatus"></span>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="adminLockBtn">Lock dashboard</button>' +
            '<button type="button" class="btn btn-primary" id="publishBtn">Save &amp; Publish</button>' +
          '</div>' +
        '</div>' +
        '<div class="admin-tabs">' + tabsHtml + '</div>' +
        '<div class="admin-panel current">' + body + '</div>' +
      '</div>' +
    '</section>';
  }

  function adminGateHtml(){
    return '<section class="page" data-page="admin">' +
      '<div class="wrap admin-gate">' +
        '<div class="gate-card">' +
          '<span class="cap-icon" style="margin:0 auto 18px;width:44px;height:44px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>' +
          '<h2>Admin dashboard</h2>' +
          '<p>Enter the PIN to edit site content. This only hides the dashboard from casual visitors — real publishing rights come from this page\'s Share settings.</p>' +
          '<form id="gateForm">' +
            '<input type="password" inputmode="numeric" id="gatePin" placeholder="PIN" autocomplete="off">' +
            '<div class="gate-error" id="gateError">Incorrect PIN — try again.</div>' +
            '<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">Unlock</button>' +
          '</form>' +
          '<p class="gate-hint">Default PIN is <b>1234</b> unless it\'s been changed under Admin &rarr; Company.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function footerHtml(){
    var c = DATA.company;
    return '' +
    '<footer class="site-footer"><div class="wrap">' +
      '<div class="footer-grid">' +
        '<div class="footer-brand"><a href="#/" class="logo">' +
          companyLogoHtml('footer-logo') + esc(c.name.split(" ")[0].toUpperCase()) +
        '</a><p>'+esc(c.tagline)+'</p></div>' +
        '<div class="footer-col"><h4>Studio</h4><ul><li><a href="#/work">Work</a></li><li><a href="#/team">Team</a></li><li><a href="#/about">About</a></li><li><a href="#/contact">Contact</a></li></ul></div>' +
        '<div class="footer-col"><h4>Services</h4><ul>' + DATA.services.slice(0,4).map(function(s){return '<li><a href="#/services/'+esc(s.id)+'">'+esc(s.title)+'</a></li>';}).join("") + '</ul></div>' +
        '<div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a></li><li><a href="tel:'+esc((c.phone||"").replace(/[^+\d]/g,""))+'">'+esc(c.phone)+'</a></li><li><a href="#/careers">Careers</a></li></ul></div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<p>&copy; 2026 '+esc(c.name)+'. Placeholder content — swap in your own.</p>' +
        '<div class="fb-right"><a href="#/admin" class="admin-link">Admin</a>' +
        '<div class="footer-social">' +
          (c.social.linkedin?'<a href="'+esc(c.social.linkedin)+'" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11v5M8 8v.01M12 16v-3a2 2 0 0 1 4 0v3M12 13v3"/></svg></a>':'') +
          (c.social.instagram?'<a href="'+esc(c.social.instagram)+'" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg></a>':'') +
          (c.social.youtube?'<a href="'+esc(c.social.youtube)+'" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5Z" fill="currentColor" stroke="none"/></svg></a>':'') +
        '</div></div>' +
      '</div>' +
    '</div></footer>';
  }

  function isAdminUnlocked(){
    try { return sessionStorage.getItem("lumen-admin-unlocked") === "1"; } catch(e){ return false; }
  }

  function appHtml(forceRoute){
    var parsed = forceRoute ? {route:forceRoute, rest:[]} : parseHash();
    var route = parsed.route;
    var servicesPage = (route === "services" && parsed.rest[0]) ? serviceDetailHtml(parsed.rest[0]) : pageServicesIndex();
    var workPage = (route === "work" && parsed.rest[0]) ? workDetailHtml(parsed.rest[0]) : pageWorkIndex();
    var pages = [pageHome(), servicesPage, workPage, pageTeam(), pageCareers(), pageAbout(), pageContact()];
    var adminPage = (route === "admin" && !forceRoute && isAdminUnlocked()) ? pageAdmin() : (route === "admin" && !forceRoute ? adminGateHtml() : '<section class="page" data-page="admin"></section>');
    return '' +
      '<div class="glow" aria-hidden="true"></div>' +
      headerHtml() +
      '<main id="top">' + pages.join("") + adminPage + '</main>' +
      footerHtml() +
      '<div class="toast" id="toast"></div>';
  }

  function primaryFieldKey(collectionKey){
    var map = {services:"title", projects:"client", team:"name", jobs:"title", access:"name"};
    return map[collectionKey];
  }
  function setDotted(obj, path, val){
    var parts = path.split(".");
    var cur = obj;
    for(var i=0;i<parts.length-1;i++){ cur = cur[parts[i]]; }
    cur[parts[parts.length-1]] = val;
  }

  // ============ TOAST ============
  var toastTimer = null;
  function showToast(msg, isErr){
    var t = document.getElementById("toast");
    if(!t) return;
    t.textContent = msg;
    t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 3200);
  }

  // ============ ACTIVATE ROUTE / SCROLL ============
  function activatePage(){
    var parsed = parseHash();
    var route = parsed.route;
    var pageEls = document.querySelectorAll(".page");
    var found = false;
    pageEls.forEach(function(p){
      var match = p.getAttribute("data-page") === route;
      p.classList.toggle("active", match);
      if(match) found = true;
    });
    if(!found){
      route = "home";
      pageEls.forEach(function(p){ p.classList.toggle("active", p.getAttribute("data-page") === "home"); });
    }
    document.querySelectorAll("#navLinks [data-route], #mobileNav [data-route]").forEach(function(el){
      var r = el.getAttribute("data-route");
      var current = r === route ||
        (r === "company" && (route === "about" || route === "team" || route === "careers" || route === "testimonials")) ||
        (r === "resources" && (route === "resources" || route === "systems" || route === "tools" || route === "configurator"));
      el.classList.toggle("current", current);
    });
    document.title = DATA.company.name + (route === "home" ? "" : " — " + route.charAt(0).toUpperCase() + route.slice(1));
  }
  function scrollForRoute(){
    if(lenisInstance) lenisInstance.scrollTo(0, {immediate:true});
    else window.scrollTo(0,0);
  }

  // ============ POST-RENDER EFFECTS ============
  function afterRenderEffects(){
    var revealEls = document.querySelectorAll(".reveal");
    if("IntersectionObserver" in window && !reduceMotion){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
      }, {threshold:0.15});
      revealEls.forEach(function(el){ io.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add("in"); });
    }

    var stats = document.querySelectorAll(".stat b[data-count]");
    function animateCount(el){
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      if(reduceMotion){ el.textContent = target; return; }
      var start = null, duration = 1100;
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts-start)/duration, 1);
        var eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.round(eased*target);
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if("IntersectionObserver" in window){
      var statIO = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ animateCount(en.target); statIO.unobserve(en.target); } });
      }, {threshold:0.4});
      stats.forEach(function(s){ statIO.observe(s); });
    } else { stats.forEach(function(s){ s.textContent = s.getAttribute("data-count"); }); }

    var panelRows = document.querySelectorAll(".panel-row");
    if(reduceMotion){ panelRows.forEach(function(l){ l.classList.add("show"); }); }
    else { panelRows.forEach(function(line,i){ setTimeout(function(){ line.classList.add("show"); }, 220+i*220); }); }

    var steps = document.querySelectorAll(".p-step");
    var panelNo = document.getElementById("panelNo");
    var panelTitle = document.getElementById("panelTitle");
    var panelDesc = document.getElementById("panelDesc");
    var trackItems = document.querySelectorAll("#stepTrack i");
    var chips = document.querySelectorAll(".chip-field .chip");
    function setActiveStep(idx){
      steps.forEach(function(s,i){ s.classList.toggle("active", i===idx); });
      trackItems.forEach(function(t,i){ t.classList.toggle("done", i<=idx); });
      if(chips.length) chips.forEach(function(c,i){ c.classList.toggle("active", i === (idx % chips.length)); });
      var el = steps[idx];
      if(!el) return;
      if(panelNo) panelNo.textContent = el.getAttribute("data-no");
      if(panelTitle) panelTitle.textContent = el.getAttribute("data-title");
      if(panelDesc) panelDesc.innerHTML = el.getAttribute("data-desc");
    }
    if(steps.length){
      setActiveStep(0);
      if("IntersectionObserver" in window){
        var stepIO = new IntersectionObserver(function(entries){
          entries.forEach(function(en){ if(en.isIntersecting){ setActiveStep(Array.prototype.indexOf.call(steps, en.target)); } });
        }, {threshold:0.5, rootMargin:"-20% 0px -20% 0px"});
        steps.forEach(function(s){ stepIO.observe(s); });
      }
    }
  }

  // ============ EVENT WIRING (re-run every render) ============
  function wireEvents(){
    var root = document.documentElement;

    if(heroSliderTimer){ clearInterval(heroSliderTimer); heroSliderTimer = null; }
    var heroSlider = document.getElementById("heroSlider");
    if(heroSlider){
      var slides = heroSlides();
      var slideIdx = 0;
      var reduceMotionHero = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var heroEyebrowEl = document.getElementById("heroEyebrow");
      var heroH1El = document.getElementById("heroH1");
      var heroLedeEl = document.getElementById("heroLede");
      var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
      function showSlide(i){
        slideIdx = (i + slides.length) % slides.length;
        heroSlider.classList.add("is-fading");
        setTimeout(function(){
          var s = slides[slideIdx];
          heroEyebrowEl.innerHTML = s.eyebrow;
          heroH1El.innerHTML = s.h1;
          heroLedeEl.textContent = s.lede;
          heroSlider.classList.remove("is-fading");
          dots.forEach(function(d,di){ d.classList.toggle("active", di === slideIdx); });
        }, 180);
      }
      function restartTimer(){
        if(heroSliderTimer) clearInterval(heroSliderTimer);
        if(reduceMotionHero || slides.length < 2) return;
        heroSliderTimer = setInterval(function(){ showSlide(slideIdx + 1); }, 6500);
      }
      dots.forEach(function(d){
        d.addEventListener("click", function(){ showSlide(parseInt(d.getAttribute("data-slide"),10)); restartTimer(); });
      });
      var heroPrevBtn = document.getElementById("heroPrev");
      var heroNextBtn = document.getElementById("heroNext");
      if(heroPrevBtn) heroPrevBtn.addEventListener("click", function(){ showSlide(slideIdx - 1); restartTimer(); });
      if(heroNextBtn) heroNextBtn.addEventListener("click", function(){ showSlide(slideIdx + 1); restartTimer(); });

      // Swipe support for touch devices
      var touchStartX = 0;
      var touchStartY = 0;
      var touchEndX = 0;
      var touchEndY = 0;
      heroSlider.addEventListener("touchstart", function(e){
        if(!e.touches || !e.touches.length) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, {passive:true});
      heroSlider.addEventListener("touchend", function(e){
        if(!e.changedTouches || !e.changedTouches.length) return;
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        var deltaX = touchEndX - touchStartX;
        var deltaY = touchEndY - touchStartY;
        // Only trigger when the gesture is clearly horizontal.
        if(Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        if(deltaX < 0) showSlide(slideIdx + 1);
        else showSlide(slideIdx - 1);
        restartTimer();
      }, {passive:true});

      restartTimer();
    }

    var themeBtn = document.getElementById("themeToggle");
    if(themeBtn) themeBtn.addEventListener("click", function(){
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      applyDesignSettings();
      try{ localStorage.setItem("lumen-theme", next); }catch(e){}
    });

    var hamburger = document.getElementById("hamburger");
    var mobileNav = document.getElementById("mobileNav");
    if(hamburger) hamburger.addEventListener("click", function(){
      var open = mobileNav.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if(mobileNav){
      mobileNav.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ mobileNav.classList.remove("open"); }); });
      var mobSvcBtn = mobileNav.querySelector('button.navlink[data-route="services"]');
      if(mobSvcBtn) mobSvcBtn.addEventListener("click", function(){ mobileNav.classList.remove("open"); window.location.hash = "#/services"; });
    }

    var dropdowns = document.querySelectorAll(".navdrop-wrap[data-dropdown]");
    function closeDropdowns(except){
      dropdowns.forEach(function(w){
        if(w !== except){ w.classList.remove("open"); var b=w.querySelector("button.navlink"); if(b) b.setAttribute("aria-expanded","false"); }
      });
    }
    dropdowns.forEach(function(w){
      var b=w.querySelector("button.navlink");
      if(!b) return;
      b.addEventListener("click", function(e){
        e.stopPropagation();
        var isOpen=w.classList.contains("open");
        closeDropdowns(w);
        w.classList.toggle("open", !isOpen);
        b.setAttribute("aria-expanded", !isOpen ? "true" : "false");
      });
    });
    document.addEventListener("click", function(e){
      if(!e.target.closest(".navdrop-wrap")) closeDropdowns(null);
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") closeDropdowns(null);
    });
    if(mobileNav){
      mobileNav.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ mobileNav.classList.remove("open"); }); });
      mobileNav.querySelectorAll("[data-mobile-menu]").forEach(function(btn){
        btn.addEventListener("click", function(){
          var key=btn.getAttribute("data-mobile-menu"), sub=mobileNav.querySelector('[data-mobile-sub="'+key+'"]');
          if(!sub) return;
          var open=sub.classList.toggle("open");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          var mark=btn.querySelector("span"); if(mark) mark.textContent=open ? "−" : "+";
        });
      });
    }

    var svcSlider = document.getElementById("svcSlider");
    var svcSliderPrev = document.getElementById("svcSliderPrev");
    var svcSliderNext = document.getElementById("svcSliderNext");
    if(svcSlider && svcSliderPrev && svcSliderNext){
      var updateSliderBtns = function(){
        svcSliderPrev.disabled = svcSlider.scrollLeft <= 4;
        svcSliderNext.disabled = svcSlider.scrollLeft >= (svcSlider.scrollWidth - svcSlider.clientWidth - 4);
      };
      svcSliderPrev.addEventListener("click", function(){ svcSlider.scrollBy({left: -svcSlider.clientWidth*0.85, behavior: reduceMotion ? "auto" : "smooth"}); });
      svcSliderNext.addEventListener("click", function(){ svcSlider.scrollBy({left: svcSlider.clientWidth*0.85, behavior: reduceMotion ? "auto" : "smooth"}); });
      svcSlider.addEventListener("scroll", updateSliderBtns, {passive:true});
      updateSliderBtns();
    }

    var contactForm = document.getElementById("contactForm");
    if(contactForm) contactForm.addEventListener("submit", function(e){
      e.preventDefault();
      var ok = document.getElementById("formSuccess");
      var err = document.getElementById("formError");
      var submit = contactForm.querySelector('button[type="submit"]');
      if(ok) ok.classList.remove("show");
      if(err) err.style.display = "none";
      if(submit){ submit.disabled = true; submit.textContent = "Sending…"; }

      var formData = new FormData(contactForm);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
      }).then(function(res){
        if(!res.ok) throw new Error("HTTP " + res.status);
        contactForm.reset();
        if(ok) ok.classList.add("show");
      }).catch(function(error){
        if(err) err.style.display = "block";
      }).finally(function(){
        if(submit){ submit.disabled = false; submit.innerHTML = "Send &rarr;"; }
      });
    });

    var gateForm = document.getElementById("gateForm");
    if(gateForm) gateForm.addEventListener("submit", function(e){
      e.preventDefault();
      var val = document.getElementById("gatePin").value;
      if(val === String(DATA.company.adminPin)){
        try{ sessionStorage.setItem("lumen-admin-unlocked","1"); }catch(err){}
        render();
      } else {
        document.getElementById("gateError").classList.add("show");
      }
    });

    var lockBtn = document.getElementById("adminLockBtn");
    if(lockBtn) lockBtn.addEventListener("click", function(){
      try{ sessionStorage.removeItem("lumen-admin-unlocked"); }catch(e){}
      render();
    });

    var publishBtn = document.getElementById("publishBtn");
    if(publishBtn) publishBtn.addEventListener("click", function(){ doPublish(); });

    var companyLogoInput = document.querySelector(".company-logo-input");
    if(companyLogoInput){
      var logoField = companyLogoInput.closest(".logo-field");
      var logoHidden = logoField.querySelector('[data-cfield="logo"]');
      var logoWrap = logoField.querySelector(".img-preview-wrap");
      var logoImg = logoWrap.querySelector(".img-preview");
      var logoStatus = logoField.querySelector(".img-upload-status");
      var logoClear = logoField.querySelector(".company-logo-clear");
      var logoUploadText = logoField.querySelector(".img-upload-btn").firstChild;
      companyLogoInput.addEventListener("change", function(){
        var file = companyLogoInput.files && companyLogoInput.files[0];
        if(!file) return;
        if(!/^image\//.test(file.type)){ logoStatus.textContent = "That file isn't an image."; return; }
        logoStatus.textContent = "Processing…";
        resizeImageToDataUrl(file, 900, 0.9, function(dataUrl){
          if(!dataUrl){ logoStatus.textContent = "Couldn't read that logo — try a PNG, JPG, WebP, or SVG."; return; }
          logoHidden.value = dataUrl;
          logoImg.src = dataUrl;
          logoWrap.hidden = false;
          logoClear.hidden = false;
          logoStatus.textContent = "Logo ready (" + Math.round(dataUrl.length/1024) + " KB) — saved when you click Save.";
          if(logoUploadText) logoUploadText.textContent = "Replace logo";
        });
      });
      logoClear.addEventListener("click", function(){
        logoHidden.value = "";
        logoWrap.hidden = true;
        logoClear.hidden = true;
        logoStatus.textContent = "";
        if(logoUploadText) logoUploadText.textContent = "Upload logo";
        companyLogoInput.value = "";
      });
    }

    var companyForm = document.getElementById("companyForm");
    if(companyForm) companyForm.addEventListener("submit", function(e){
      e.preventDefault();
      companyForm.querySelectorAll("[data-cfield]").forEach(function(input){
        setDotted(DATA.company, input.getAttribute("data-cfield"), input.value.trim());
      });
      companyForm.querySelectorAll("[data-ctoggle]").forEach(function(input){
        setDotted(DATA.company, input.getAttribute("data-ctoggle"), input.checked);
      });
      designSettings();
      companyForm.querySelectorAll("[data-design-field]").forEach(function(input){
        var key = input.getAttribute("data-design-field");
        var value = input.value.trim();
        if(input.type === "range") value = parseFloat(value);
        setDotted(DATA.design, key, value);
      });
      applyDesignSettings();
      if(window.__refreshNeural) window.__refreshNeural();
      companyForm.querySelectorAll("[data-stat-value]").forEach(function(input){
        var i = parseInt(input.getAttribute("data-stat-value"),10);
        var n = parseFloat(input.value);
        DATA.company.stats[i].value = isNaN(n) ? 0 : n;
      });
      companyForm.querySelectorAll("[data-stat-label]").forEach(function(input){
        var i = parseInt(input.getAttribute("data-stat-label"),10);
        DATA.company.stats[i].label = input.value.trim();
      });
      showToast("Company info updated — publishing…");
      render();
      doPublish();
    });

    document.querySelectorAll("[data-design-field]").forEach(function(input){
      input.addEventListener("input", function(){
        if(input.type === "range") {
          var out = input.parentElement.querySelector("output");
          if(out) out.textContent = input.value;
        } else if(input.type === "color") {
          var text = input.parentElement.querySelector('input[type="text"]');
          if(text) text.value = input.value;
        } else if(input.type === "text" && /^#[0-9a-fA-F]{6}$/.test(input.value)) {
          var color = input.parentElement.querySelector('input[type="color"]');
          if(color) color.value = input.value;
        }
      });
    });

    var itemForm = document.getElementById("itemForm");
    if(itemForm){
      itemForm.querySelectorAll(".img-file-input").forEach(function(fileInput){
        var field = fileInput.closest(".img-field");
        var hidden = field.querySelector('[data-field="'+fileInput.getAttribute("data-imgfield")+'"]');
        var wrap = field.querySelector(".img-preview-wrap");
        var img = wrap.querySelector(".img-preview");
        var status = field.querySelector(".img-upload-status");
        var clearBtn = field.querySelector(".img-clear-btn");
        var uploadLabelText = field.querySelector(".img-upload-btn").firstChild;
        fileInput.addEventListener("change", function(){
          var file = fileInput.files && fileInput.files[0];
          if(!file) return;
          if(!/^image\//.test(file.type)){ status.textContent = "That file isn't an image."; return; }
          status.textContent = "Processing…";
          resizeImageToDataUrl(file, 1600, 0.82, function(dataUrl){
            if(!dataUrl){ status.textContent = "Couldn't read that image — try another file."; return; }
            hidden.value = dataUrl;
            img.src = dataUrl;
            wrap.hidden = false;
            clearBtn.hidden = false;
            status.textContent = "Image ready (" + Math.round(dataUrl.length/1024) + " KB) — saved when you click Save.";
            if(uploadLabelText) uploadLabelText.textContent = "Replace image";
          });
        });
      });
      itemForm.querySelectorAll(".img-clear-btn").forEach(function(btn){
        btn.addEventListener("click", function(){
          var field = btn.closest(".img-field");
          var hidden = field.querySelector('[data-field="'+btn.getAttribute("data-imgclear")+'"]');
          var wrap = field.querySelector(".img-preview-wrap");
          var status = field.querySelector(".img-upload-status");
          var uploadLabelText = field.querySelector(".img-upload-btn").firstChild;
          hidden.value = "";
          wrap.hidden = true;
          btn.hidden = true;
          status.textContent = "";
          if(uploadLabelText) uploadLabelText.textContent = "Upload image";
        });
      });
    }
    if(itemForm) itemForm.addEventListener("submit", function(e){
      e.preventDefault();
      var collectionKey = itemForm.getAttribute("data-collection");
      var id = itemForm.getAttribute("data-id");
      var schema = SCHEMAS[collectionKey];
      var obj = {};
      schema.fields.forEach(function(f){
        var input = itemForm.querySelector('[data-field="'+f.key+'"]');
        if(!input) return;
        if(f.type === "checkbox"){ obj[f.key] = input.checked; }
        else if(f.type === "lines"){ obj[f.key] = input.value.split("\n").map(function(s){return s.trim();}).filter(Boolean); }
        else { obj[f.key] = input.value.trim(); }
      });
      if(id){
        var existing = findItem(collectionKey, id);
        if(existing) Object.assign(existing, obj);
        showToast(schema.label + " updated — publishing…");
      } else {
        var base = slugify(obj[primaryFieldKey(collectionKey)] || collectionKey);
        obj.id = uniqueId(collectionKey, base);
        if(collectionKey === "jobs" && !obj.status) obj.status = "open";
        DATA[collectionKey].push(obj);
        showToast(schema.label + " added — publishing…");
      }
      window.location.hash = "#/admin/" + collectionKey;
      doPublish();
    });

    document.querySelectorAll(".ar-delete").forEach(function(btn){
      btn.addEventListener("click", function(){
        var row = btn.closest(".admin-row");
        var id = row.getAttribute("data-id");
        var collectionKey = parseHash().rest[0];
        var schema = SCHEMAS[collectionKey];
        if(!window.confirm("Delete this " + (schema ? schema.label.toLowerCase() : "item") + "? This can't be undone.")) return;
        var idx = indexOfItem(collectionKey, id);
        if(idx > -1) DATA[collectionKey].splice(idx,1);
        showToast("Deleted — publishing…");
        render();
        doPublish();
      });
    });
    document.querySelectorAll(".ar-move").forEach(function(btn){
      btn.addEventListener("click", function(){
        var row = btn.closest(".admin-row");
        var id = row.getAttribute("data-id");
        var dir = parseInt(btn.getAttribute("data-dir"),10);
        var collectionKey = parseHash().rest[0];
        var arr = DATA[collectionKey];
        var idx = indexOfItem(collectionKey, id);
        var swapWith = idx + dir;
        if(idx > -1 && swapWith >= 0 && swapWith < arr.length){
          var tmp = arr[idx]; arr[idx] = arr[swapWith]; arr[swapWith] = tmp;
        }
        render();
      });
    });
  }

  // ============ SPOTLIGHT HOVER (bound once, delegated) ============
  function initSpotlight(){
    document.addEventListener("pointermove", function(e){
      var el = e.target && e.target.closest ? e.target.closest(".spotlight, .btn-primary") : null;
      if(!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, {passive:true});
  }

  // ============ SMOOTH SCROLL (Lenis) ============
  function initLenis(){
    if(reduceMotion || typeof window.Lenis !== "function") return;
    lenisInstance = new window.Lenis({ duration: 1.05, smoothWheel: true });
    requestAnimationFrame(function raf(time){
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    });
  }

  // ============ NEURAL NETWORK BACKGROUND (canvas, lives outside #app) ============
  function initNeuralBackground(){
    var canvas = document.getElementById("neuralCanvas");
    if(!canvas || !canvas.getContext || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], accentColor = "161, 161, 170", frame = 0, raf = null, running = true;
    var ns = designSettings().neural;

    function hexToRgb(hex){
      hex = hex.replace("#","");
      if(hex.length === 3){ hex = hex.split("").map(function(c){ return c+c; }).join(""); }
      var num = parseInt(hex,16);
      if(isNaN(num)) return null;
      return ((num>>16)&255)+","+((num>>8)&255)+","+(num&255);
    }
    function readAccent(){
      try{
        var v = getComputedStyle(document.documentElement).getPropertyValue("--accentNeural").trim();
        var rgb = v.charAt(0) === "#" ? hexToRgb(v) : null;
        if(rgb) accentColor = rgb;
      }catch(e){}
    }
    function makeNodes(){
      ns = designSettings().neural;
      var count = Math.max(12, Math.min(180, Math.round((w*h)/Math.max(5000, Number(ns.density)||32000))));
      nodes = [];
      for(var i=0;i<count;i++){
        var speed = Math.max(0, Number(ns.speed)||0.5);
        nodes.push({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*speed, vy: (Math.random()-0.5)*speed });
      }
    }
    function resize(){
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
      canvas.style.width = w+"px"; canvas.style.height = h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      makeNodes();
    }
    function step(){
      if(!running) return;
      frame++;
      if(frame % 90 === 0) readAccent();
      ctx.clearRect(0,0,w,h);
      ns = designSettings().neural;
      var maxDist = Math.min(Number(ns.maxDistance)||150, Math.max(60, w/9));
      var i,a,b,n;
      for(i=0;i<nodes.length;i++){
        n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if(n.x < 0 || n.x > w) n.vx *= -1;
        if(n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
      }
      for(a=0;a<nodes.length;a++){
        for(b=a+1;b<nodes.length;b++){
          var dx = nodes[a].x-nodes[b].x, dy = nodes[a].y-nodes[b].y;
          var dist = Math.sqrt(dx*dx+dy*dy);
          if(dist < maxDist){
            var alpha = (1 - dist/maxDist) * 0.16;
            ctx.strokeStyle = "rgba("+accentColor+","+alpha.toFixed(6)+")";
            ctx.lineWidth = Math.max(0.25, Number(ns.lineWidth)||1);
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }
      for(i=0;i<nodes.length;i++){
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, Math.max(0.5, Number(ns.nodeSize)||2), 0, Math.PI*2);
        ctx.fillStyle = "rgba("+accentColor+",0.55)";
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    readAccent();
    resize();
    window.__refreshNeural = function(){ ns = designSettings().neural; readAccent(); resize(); };
    raf = requestAnimationFrame(step);

    var resizeTimer = null;
    window.addEventListener("resize", function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });
    document.addEventListener("visibilitychange", function(){
      if(document.hidden){
        running = false;
        if(raf) cancelAnimationFrame(raf);
      } else if(!running){
        running = true;
        raf = requestAnimationFrame(step);
      }
    });
  }

  // ============ RENDER ============
  function render(){
    applyDesignSettings();
    document.getElementById("app").innerHTML = appHtml();
    activatePage();
    wireEvents();
    afterRenderEffects();
  }

  // ============ PUBLISH ============
  var LT = String.fromCharCode(60);
  var CLOSE_SCRIPT_TAG = LT + "/script>";
  var CLOSE_SCRIPT_BARE = LT + "/script";

  function buildDocument(){
    var styleText = document.getElementById("appStyle").textContent;
    var scriptText = document.getElementById("appScript").textContent;
    var jsonText = JSON.stringify(DATA).split(CLOSE_SCRIPT_BARE).join(LT + "\\/script");
    var bodyInner = appHtml("home");
    return "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>" + esc(DATA.company.name) + "</title>\n" + GOOGLE_FONTS_LINK + "\n<style id=\"appStyle\">" + styleText + "</style>\n</head>\n<body>\n<canvas id=\"neuralCanvas\" aria-hidden=\"true\"></canvas>\n<div id=\"app\">" + bodyInner + "</div>\n<script type=\"application/json\" id=\"siteData\">" + jsonText + CLOSE_SCRIPT_TAG + "\n<script id=\"appScript\">" + scriptText + CLOSE_SCRIPT_TAG + "\n</body>\n</html>";
  }

  var artifactApi = null;
  var artifactReady = Promise.resolve(null);
  var publishing = false;
  function doPublish(){
    if(publishing) return;
    publishing = true;
    var statusEl = document.getElementById("saveStatus");
    var btn = document.getElementById("publishBtn");
    if(btn) btn.disabled = true;
    if(statusEl){ statusEl.textContent = "Saving to Netlify…"; statusEl.className = "save-status"; }
    try{
      sessionStorage.setItem("lumen-admin-unlocked","1");
      sessionStorage.setItem("lumen-admin-hash", window.location.hash || "#/admin/overview");
    }catch(e){}

    fetch('/.netlify/functions/site-data', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(DATA)
    }).then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(payload){
        if(!res.ok) throw new Error((payload.error || 'Could not save site data.') + (payload.detail ? ' ' + payload.detail : ''));
        return payload;
      });
    }).then(function(){
      if(statusEl){ statusEl.textContent = "Saved — changes will survive refreshes and future Netlify deploys."; statusEl.className = "save-status ok"; }
      showToast("Saved successfully.");
      publishing = false; if(btn) btn.disabled = false;
    }).catch(function(err){
      if(statusEl){ statusEl.textContent = err.message || "Could not save changes."; statusEl.className = "save-status err"; }
      showToast(err.message || "Could not save changes.", true);
      publishing = false; if(btn) btn.disabled = false;
    });
  }


  // ============ GROWTH PLATFORM EXPANSION ============
  function pageTools(){
    return '<section class="page" data-page="tools"><div class="wrap page-hero"><span class="eyebrow">FREE GROWTH TOOLS</span><h1>Find the gaps. Then <em>fix them.</em></h1><p class="lede">Interactive tools built to show prospects where growth is leaking across search, AI, conversion and competition.</p></div><div class="wrap tool-grid">'+
    toolCard('Website Audit','Scan your website for SEO, local, content and technical opportunities.','audit')+
    toolCard('AI Visibility','Check how visible your brand is across AI-powered discovery.','ai')+
    toolCard('ROI Calculator','Estimate the revenue opportunity hiding in your current traffic.','roi')+
    toolCard('Competitor Analysis','Compare your digital footprint against a competitor.','competitor')+
    '</div></section>';
  }
  function toolCard(title,desc,id){return '<a class="growth-card" href="#/tools/'+id+'"><span class="gc-icon">'+(id==='audit'?'01':id==='ai'?'02':id==='roi'?'03':'04')+'</span><h3>'+title+'</h3><p>'+desc+'</p><b>Launch tool →</b></a>';}
  function toolDetail(type){
    var configs={
      audit:{title:'Free Website & Visibility Audit',sub:'Get a snapshot of your SEO, local presence, AI readiness, speed and content opportunities.',fields:'<input id="toolWebsite" placeholder="https://yourwebsite.com"><input id="toolBusiness" placeholder="Business name"><input id="toolEmail" type="email" placeholder="Work email">',btn:'Analyze My Website',result:'auditResult'},
      ai:{title:'AI Visibility Checker',sub:'See how prepared your brand is for the next generation of search and answer engines.',fields:'<input id="toolBusiness" placeholder="Business name"><input id="toolWebsite" placeholder="Website URL"><input id="toolKeyword" placeholder="Primary target keyword">',btn:'Check AI Visibility',result:'aiResult'},
      roi:{title:'Marketing ROI Calculator',sub:'Model the revenue impact of improving traffic and conversion performance.',fields:'<input id="visitors" type="number" placeholder="Monthly website visitors"><input id="conversion" type="number" step="0.1" placeholder="Conversion rate %"><input id="value" type="number" placeholder="Average customer value"><input id="uplift" type="number" value="50" placeholder="Expected growth %">',btn:'Calculate Opportunity',result:'roiResult'},
      competitor:{title:'Competitor Gap Analysis',sub:'Compare your website against a competitor and uncover the opportunities worth pursuing.',fields:'<input id="toolWebsite" placeholder="Your website"><input id="competitorUrl" placeholder="Competitor website"><input id="toolKeyword" placeholder="Target market or keyword">',btn:'Compare Businesses',result:'competitorResult'}
    };
    var c=configs[type]||configs.audit;
    return '<section class="page" data-page="tools"><div class="wrap page-hero tool-page"><a class="back-link" href="#/tools">← All tools</a><span class="eyebrow">LUMEN INTELLIGENCE</span><h1>'+c.title+'</h1><p class="lede">'+c.sub+'</p><div class="tool-panel"><div class="tool-fields">'+c.fields+'</div><button class="btn btn-primary" id="runTool" data-tool="'+type+'">'+c.btn+' →</button><div class="tool-result" id="'+c.result+'"><div class="empty-state">Enter your details to generate your preview report.</div></div><p class="tool-disclaimer">Demo version: results are interactive estimates. Connect real data APIs for production-grade reports.</p></div></div></section>';
  }
  function pageSystems(){
    var items=[['AI CRM','One command center for leads, contacts, deals, tasks and follow-ups.'],['AI Sales Agent','A 24/7 website agent that qualifies, answers and books.'],['Lead Follow-Up','Multi-step email and SMS nurturing that never forgets a lead.'],['Review Automation','Automatically request reviews and route unhappy customers to private recovery.'],['Client Reactivation','Segment old customers and launch win-back campaigns.'],['AI Email Marketing','Generate, personalize, test and automate campaigns.'],['Appointment Booking','Qualification, calendar booking, reminders and no-show recovery.'],['Call Intelligence','Track calls and use AI to surface objections and missed opportunities.'],['Reputation Hub','Monitor reviews and draft responses from one dashboard.'],['Social AI Engine','Plan, create, repurpose and schedule content.']];
    return '<section class="page" data-page="systems"><div class="wrap page-hero"><span class="eyebrow">AI GROWTH SYSTEMS</span><h1>Marketing that keeps working <em>after you log off.</em></h1><p class="lede">We design connected systems around your sales, marketing and customer lifecycle.</p></div><div class="wrap systems-grid">'+items.map(function(x,i){return '<a href="#/systems/'+slugify(x[0])+'" class="system-card"><span>'+String(i+1).padStart(2,'0')+'</span><h3>'+x[0]+'</h3><p>'+x[1]+'</p><b>Explore system →</b></a>';}).join('')+'</div></section>';
  }
  function pageSystemDetail(id){
    var title=(id||'ai-crm').split('-').map(function(x){return x.charAt(0).toUpperCase()+x.slice(1);}).join(' ');
    var features={
      'ai-crm':['Lead management','Pipeline stages','Contacts and companies','Tasks and notes','Deals and revenue','Team activity'],
      'ai-sales-agent':['Website conversations','Lead qualification','FAQ knowledge base','Service recommendations','Lead capture','Appointment booking'],
      'lead-follow-up':['Email sequences','SMS triggers','Behavior tracking','Hot lead alerts','AI personalization','Re-engagement logic'],
      'review-automation':['Automated requests','Feedback routing','Review links','Response drafts','Reputation analytics','Team alerts'],
      'client-reactivation':['Audience segmentation','Win-back campaigns','VIP targeting','Offer automation','Email + SMS','Revenue tracking'],
      'ai-email-marketing':['Campaign generation','Segmentation','A/B testing','Automations','Nurture sequences','Analytics'],
      'appointment-booking':['Calendar integration','Qualification forms','Confirmations','Reminders','Rescheduling','No-show recovery'],
      'call-intelligence':['Call tracking','Transcripts','Sentiment analysis','Objection detection','Sales scoring','Coaching insights'],
      'reputation-hub':['Review monitoring','Multi-platform inbox','AI replies','Rating trends','Request campaigns','Alerts'],
      'social-ai-engine':['Content ideas','Caption generation','Repurposing','Scheduling','Content calendar','Analytics']
    };
    var f=features[id]||features['ai-crm'];
    return '<section class="page" data-page="systems"><div class="wrap page-hero"><a class="back-link" href="#/systems">← AI Growth Systems</a><span class="eyebrow">SYSTEM MODULE</span><h1>'+title+'</h1><p class="lede">A configurable growth system built around your existing business process, not another disconnected tool.</p><div class="feature-list">'+f.map(function(x){return '<div>✓ '+x+'</div>';}).join('')+'</div><a href="#/contact" class="btn btn-primary">Build This System →</a></div></section>';
  }
  function pageDashboard(){
    return '<section class="page" data-page="dashboard"><div class="wrap dashboard-wrap"><div class="dash-head"><div><span class="eyebrow">CLIENT PORTAL</span><h1>Growth Command Center</h1><p>Demo dashboard for marketing performance, leads and automation.</p></div><span class="demo-badge">DEMO DATA</span></div><div class="dash-stats"><div><span>Organic Traffic</span><b>+124%</b><small>vs previous period</small></div><div><span>Qualified Leads</span><b>+87%</b><small>this month</small></div><div><span>AI Citations</span><b>+56</b><small>tracked mentions</small></div><div><span>Reviews</span><b>4.8★</b><small>+32 new</small></div></div><div class="dashboard-grid"><div class="dash-card wide"><h3>Revenue & Lead Trend</h3><div class="fake-chart"><i style="height:30%"></i><i style="height:45%"></i><i style="height:40%"></i><i style="height:60%"></i><i style="height:70%"></i><i style="height:84%"></i><i style="height:95%"></i></div></div><div class="dash-card"><h3>Pipeline</h3><div class="pipeline"><p>New Lead <b>24</b></p><p>Qualified <b>16</b></p><p>Meeting <b>9</b></p><p>Proposal <b>6</b></p><p>Won <b>4</b></p></div></div><div class="dash-card"><h3>Automation Activity</h3><ul class="activity"><li>Review request sent to Sarah</li><li>Hot lead alert: pricing page visited</li><li>Win-back campaign opened</li><li>AI agent booked a call</li></ul></div></div></div></section>';
  }
  function pageResources(){var posts=[['AI Search Is Changing Discovery','How to prepare content for answer engines and generative search.'],['The Local Visibility Playbook','A practical framework for maps, reviews and local demand.'],['Marketing Automation That Actually Converts','Where automation helps and where human intervention still matters.'],['From Traffic to Revenue','The measurement system behind scalable marketing decisions.']];return '<section class="page" data-page="resources"><div class="wrap page-hero"><span class="eyebrow">RESOURCES</span><h1>Strategies worth <em>keeping.</em></h1><p class="lede">Practical thinking on SEO, AI visibility, automation, local growth and conversion.</p></div><div class="wrap resources-grid">'+posts.map(function(p,i){return '<article class="resource-card"><span>GUIDE 0'+(i+1)+'</span><h3>'+p[0]+'</h3><p>'+p[1]+'</p><a href="#/contact">Get the strategy →</a></article>';}).join('')+'</div></section>';}
  function pageTestimonials(){return '<section class="page" data-page="testimonials"><div class="wrap page-hero"><span class="eyebrow">CLIENT RESULTS</span><h1>Proof before <em>promises.</em></h1><p class="lede">A results-focused agency should make outcomes easy to understand.</p><div class="testimonial-grid"><blockquote>“The strategy connected our SEO and lead generation efforts instead of treating them like separate projects.”<footer>Growth Director · Home Services</footer></blockquote><blockquote>“We finally had visibility into where leads were coming from and what happened after they entered the pipeline.”<footer>Founder · Professional Services</footer></blockquote><blockquote>“The automation work saved our team hours every week while improving follow-up consistency.”<footer>Operations Lead · Local Business</footer></blockquote></div></div></section>';}
  function pageConfigurator(){var opts=['SEO','Local SEO','AEO / GEO','Paid Ads','AI Visibility','Automation','AI Sales Agent','Review Automation','Content','Social Media'];return '<section class="page" data-page="configurator"><div class="wrap page-hero"><span class="eyebrow">BUILD YOUR SYSTEM</span><h1>What should your growth stack <em>include?</em></h1><p class="lede">Select the capabilities you need and get an interactive recommended system.</p><div class="config-panel"><div class="config-options">'+opts.map(function(x,i){return '<label><input type="checkbox" value="'+x+'" '+(i<3?'checked':'')+'><span>'+x+'</span></label>';}).join('')+'</div><button class="btn btn-primary" id="buildSystem">Build My Growth System →</button><div id="configResult" class="tool-result"></div></div></div></section>';}

  var originalAppHtml = appHtml;
  appHtml = function(forceRoute){
    var parsed = forceRoute ? {route:forceRoute, rest:[]} : parseHash();
    var route=parsed.route, rest=parsed.rest||[];
    if(['tools','systems','dashboard','resources','testimonials','configurator'].indexOf(route)===-1) return originalAppHtml(forceRoute);
    var content='';
    if(route==='tools') content=rest[0]?toolDetail(rest[0]):pageTools();
    if(route==='systems') content=rest[0]?pageSystemDetail(rest[0]):pageSystems();
    if(route==='dashboard') content=pageDashboard();
    if(route==='resources') content=pageResources();
    if(route==='testimonials') content=pageTestimonials();
    if(route==='configurator') content=pageConfigurator();
    return '<div class="glow" aria-hidden="true"></div>'+headerHtml()+'<main id="top">'+content+'</main>'+footerHtml()+'<div class="toast" id="toast"></div>';
  };

  document.addEventListener('click', function(e){
    var btn=e.target.closest('#runTool');
    if(btn){var type=btn.getAttribute('data-tool'); runGrowthTool(type);}
    var build=e.target.closest('#buildSystem'); if(build){buildGrowthSystem();}
  });
  function runGrowthTool(type){
    if(type==='audit'){var r=document.getElementById('auditResult'); if(r) r.innerHTML=scoreReport('YOUR DIGITAL VISIBILITY SCORE',[72,48,34,81,57],['SEO','Local SEO','AI Visibility','Website Speed','Content Authority']);}
    if(type==='ai'){var r=document.getElementById('aiResult'); if(r) r.innerHTML='<h3>AI VISIBILITY REPORT</h3><div class="ai-results"><p>ChatGPT <b>Needs improvement</b></p><p>Perplexity <b>Limited mentions</b></p><p>Google AI Overviews <b>Partial visibility</b></p><p>Gemini <b>Needs improvement</b></p></div><div class="overall-score">34<span>/100</span><small>Estimated AI visibility</small></div>';}
    if(type==='roi'){var v=+(document.getElementById('visitors')||{}).value||1000,c=+(document.getElementById('conversion')||{}).value||2,val=+(document.getElementById('value')||{}).value||500,u=+(document.getElementById('uplift')||{}).value||50,current=v*(c/100)*val,potential=current*(1+u/100),r=document.getElementById('roiResult'); if(r) r.innerHTML='<div class="roi-box"><div><span>Current Revenue Opportunity</span><b>$'+Math.round(current).toLocaleString()+'</b></div><div><span>Potential Opportunity</span><b>$'+Math.round(potential).toLocaleString()+'</b></div><div><span>Estimated Growth</span><b>+'+u+'%</b></div></div>';}
    if(type==='competitor'){var r=document.getElementById('competitorResult'); if(r) r.innerHTML='<h3>COMPETITIVE GAP PREVIEW</h3><table class="compare-table"><tr><th>Metric</th><th>You</th><th>Competitor</th></tr><tr><td>Authority Signals</td><td>32</td><td>48</td></tr><tr><td>Content Footprint</td><td>120</td><td>340</td></tr><tr><td>Keyword Coverage</td><td>540</td><td>1,230</td></tr><tr><td>AI Visibility</td><td>34%</td><td>67%</td></tr></table>';}
  }
  function scoreReport(title,scores,labels){return '<h3>'+title+'</h3><div class="score-list">'+scores.map(function(x,i){return '<div><span>'+labels[i]+'</span><div class="score-bar"><i style="width:'+x+'%"></i></div><b>'+x+'/100</b></div>';}).join('')+'</div><div class="result-callout">Top opportunities: schema markup, AI-ready content, local authority signals and conversion tracking.<br><a href="#/contact">Get a complete growth strategy →</a></div>';}
  function buildGrowthSystem(){var selected=[].slice.call(document.querySelectorAll('.config-options input:checked')).map(function(x){return x.value;}),base=selected.length*750+500,r=document.getElementById('configResult');if(r) r.innerHTML='<h3>Your Recommended Growth System</h3><p>'+selected.join(' + ')+'</p><div class="overall-score">$'+base.toLocaleString()+'<span>+/mo</span><small>Estimated starting investment</small></div><a class="btn btn-primary" href="#/contact">Book a Strategy Call →</a>';}

  // ============ BOOT ============
  (function initTheme(){
    var stored = null;
    try{ stored = localStorage.getItem("lumen-theme"); }catch(e){}
    if(stored === "light" || stored === "dark"){ document.documentElement.setAttribute("data-theme", stored); }
  })();
  (function restoreAdminHash(){
    var stashed = null;
    try{ stashed = sessionStorage.getItem("lumen-admin-hash"); sessionStorage.removeItem("lumen-admin-hash"); }catch(e){}
    if(stashed && window.location.hash !== stashed){ window.location.hash = stashed; }
  })();

  initSpotlight();
  initLenis();
  initNeuralBackground();
  // Load server-persisted dashboard data before the first render.
  loadSiteData().then(function(){
    render();
    scrollForRoute();
  });
  window.addEventListener("hashchange", function(){ render(); scrollForRoute(); });
  window.addEventListener("scroll", function(){
    var h = document.getElementById("siteHeader");
    if(h) h.classList.toggle("scrolled", window.scrollY > 8);
  }, {passive:true});
})();

