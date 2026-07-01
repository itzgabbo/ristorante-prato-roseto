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
        const scrollThreshold = 10; // Minimo scroll in px per triggerare l'evento
        
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Nascondi l'header se scrolliamo verso il basso
            if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
                header.classList.add('hidden');
                // Se il menu mobile è aperto, chiudiamolo
                if (mainNav && mainNav.classList.contains('show')) {
                    mainNav.classList.remove('show');
                    if (mobileMenuBtn) {
                        const icon = mobileMenuBtn.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            } 
            // Mostra l'header se scrolliamo verso l'alto
            else if (currentScrollY < lastScrollY) {
                header.classList.remove('hidden');
            }
            
            lastScrollY = currentScrollY;
        };
        
        // Aggiungiamo l'event listener per lo scroll
        window.addEventListener('scroll', handleScroll, { passive: true });
    }
});
