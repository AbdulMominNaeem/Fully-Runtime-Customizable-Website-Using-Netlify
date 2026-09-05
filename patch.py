from pathlib import Path
p=Path('/mnt/data/navfix/script.js')
s=p.read_text()
start=s.index('  function headerHtml(){')
end=s.index('\n  function statRowHtml(){', start)
new=r'''  function headerHtml(){
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
'''
s=s[:start]+new+s[end:]
# Remove enhancement wrapper that was causing repeated nav items.
old_start=s.index('  // Preserve the original header renderer before enhancing it.')
old_end=s.index('\n  var originalAppHtml = appHtml;', old_start)
s=s[:old_start]+s[old_end+1:]
# Replace nav activation current logic.
old='''    document.querySelectorAll("#navLinks [data-route], #mobileNav [data-route]").forEach(function(el){
      var r = el.getAttribute("data-route");
      var current = r === route || (r === "company" && (route === "about" || route === "team" || route === "careers"));
      el.classList.toggle("current", current);
    });'''
new2='''    document.querySelectorAll("#navLinks [data-route], #mobileNav [data-route]").forEach(function(el){
      var r = el.getAttribute("data-route");
      var current = r === route ||
        (r === "company" && (route === "about" || route === "team" || route === "careers" || route === "testimonials")) ||
        (r === "resources" && (route === "resources" || route === "systems" || route === "tools" || route === "configurator"));
      el.classList.toggle("current", current);
    });'''
s=s.replace(old,new2)
# Replace dropdown/mobile interaction block.
start2=s.index('    var dropWrap = document.getElementById("servicesDropWrap");')
end2=s.index('\n    var svcSlider = document.getElementById("svcSlider");', start2)
new3='''    var dropdowns = document.querySelectorAll(".navdrop-wrap[data-dropdown]");
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
'''
s=s[:start2]+new3+s[end2:]
p.write_text(s)
