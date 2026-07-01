// Gestione del menu hamburger per mobile + Smart Header (hide on scroll)
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    const header = document.querySelector('header');
    
    // --- SMARTPHONE MENU HAMBURGER ---
    if (mobileMenuBtn && mainNav) {
        // Toggle menu al click sul pulsante
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('show');
            
            // Cambia l'icona (opzionale: da hamburger a X)
            const icon = this.querySelector('i');
            if (mainNav.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Chiudi il menu quando si clicca su un link
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                mainNav.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        
        // Chiudi il menu quando si clicca fuori dall'header
        document.addEventListener('click', function(event) {
            if (!event.target.closest('header')) {
                mainNav.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // --- SMART HEADER (HIDE ON SCROLL DOWN, SHOW ON SCROLL UP) ---
    if (header) {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', function() {
            const currentScrollY = window.scrollY;
            
            // Se scroll verso il basso e oltre i 50px: nascondi header
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                header.classList.add('header-hidden');
            } 
            // Se scroll verso l'alto: mostra header
            else if (currentScrollY < lastScrollY) {
                header.classList.remove('header-hidden');
            }
            
            // Aggiorna sempre lastScrollY per il prossimo ciclo
            lastScrollY = currentScrollY;
        }, { passive: true });
    }
});
