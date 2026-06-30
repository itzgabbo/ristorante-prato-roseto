// Gestione del menu hamburger per mobile
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    
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
});
