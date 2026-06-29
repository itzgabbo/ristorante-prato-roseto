// Gestione delle categorie del menu
document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuSections = document.querySelectorAll('.menu-section');

    // Mostra la sezione attiva all'avvio
    const activeSection = document.querySelector('.menu-section.active');
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    // Gestione dei pulsanti delle categorie
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target') || this.getAttribute('data-category');
            
            // Rimuovi la classe active da tutti i pulsanti e le sezioni
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            menuSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            
            // Aggiungi la classe active al pulsante cliccato
            this.classList.add('active');
            
            // Mostra la sezione corrispondente
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
                
                // Scorri verso la sezione in modo fluido
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Chiudi il menu quando si fa clic fuori
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.header-content') && !event.target.closest('.mobile-menu-btn')) {
                mainNav.classList.remove('show');
            }
        });
    }
});
