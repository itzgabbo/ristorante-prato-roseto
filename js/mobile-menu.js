// Gestione del menu mobile e dello scroll dell'header
document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('show');
        });
        
        // Chiudi il menu quando si clicca su un link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('show');
            });
        });
    }
    
    // Gestione dello scroll per l'header
    const header = document.querySelector('header');
    let lastScroll = 0;
    
    if (header) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            // Solo per schermi grandi
            if (window.innerWidth > 768) {
                if (currentScroll <= 0) {
                    // In cima alla pagina
                    header.classList.remove('scrolled-up');
                    header.classList.remove('scrolled-down');
                    return;
                }
                
                if (currentScroll > lastScroll && !header.classList.contains('scrolled-down')) {
                    // Scrolling down
                    header.classList.remove('scrolled-up');
                    header.classList.add('scrolled-down');
                } else if (currentScroll < lastScroll && header.classList.contains('scrolled-down')) {
                    // Scrolling up
                    header.classList.remove('scrolled-down');
                    header.classList.add('scrolled-up');
                }
                
                lastScroll = currentScroll;
            }
        });
    }
});
