document.addEventListener('DOMContentLoaded', function() {
    const dataInput = document.getElementById('data');
    const oraSelect = document.getElementById('ora');
    
    if (!dataInput || !oraSelect) {
        console.error('Elementi del form non trovati');
        return;
    }

    // Formatta la data come YYYY-MM-DD
    function formattaData(data) {
        const d = new Date(data);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }
    
    // Imposta la data minima a oggi
    const oggi = new Date();
    const dataMinima = formattaData(oggi);
    dataInput.min = dataMinima;
    dataInput.value = dataMinima;
    
    // Blocca la modifica manuale della data
    dataInput.addEventListener('keydown', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Gestione del cambio data
    dataInput.addEventListener('change', aggiornaOrari);
    
    // Funzione per aggiornare gli orari disponibili
    function aggiornaOrari() {
        console.log('Aggiornamento orari...');
        const dataSelezionata = new Date(dataInput.value);
        const giornoSettimana = dataSelezionata.getDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
        const isOggi = dataSelezionata.toDateString() === new Date().toDateString();
        const isLunedi = giornoSettimana === 1;
        
        // Svuota il menu a tendina
        oraSelect.innerHTML = '<option value="">Seleziona orario</option>';
        
        // Orari di pranzo (12:15 - 14:45 con intervalli di 15 minuti)
        const orariPranzo = [
            '12:15', '12:30', '12:45',
            '13:00', '13:15', '13:30', '13:45',
            '14:00', '14:15', '14:30', '14:45'
        ];
        
        // Orari di cena (19:30 - 21:45 con intervalli di 15 minuti)
        const orariCena = [
            '19:30', '19:45',
            '20:00', '20:15', '20:30', '20:45',
            '21:00', '21:15', '21:30', '21:45'
        ];
        
        // Filtra gli orari in base al giorno e all'orario attuale
        const orariDisponibili = [];
        const oraCorrente = new Date();
        
        // Se è lunedì, mostra solo pranzo
        if (isLunedi) {
            console.log('Lunedì: mostro solo orari di pranzo');
            orariPranzo.forEach(ora => {
                if (isOggi) {
                    const [h, m] = ora.split(':').map(Number);
                    const oraPrenotazione = new Date();
                    oraPrenotazione.setHours(h, m, 0, 0);
                    if (oraPrenotazione > oraCorrente) {
                        orariDisponibili.push(ora);
                    }
                } else {
                    orariDisponibili.push(ora);
                }
            });
        } 
        // Se non è lunedì, mostra sia pranzo che cena
        else {
            // Per oggi, filtra gli orari passati
            if (isOggi) {
                console.log('Oggi, filtriamo gli orari passati...');
                // Mostra pranzo
                orariPranzo.forEach(ora => {
                    const [h, m] = ora.split(':').map(Number);
                    const oraPrenotazione = new Date();
                    oraPrenotazione.setHours(h, m, 0, 0);
                    if (oraPrenotazione > oraCorrente) {
                        orariDisponibili.push(ora);
                    }
                });
                
                // Se siamo di pomeriggio, mostra la cena
                if (oraCorrente.getHours() >= 15) {
                    orariCena.forEach(ora => {
                        const [h, m] = ora.split(':').map(Number);
                        const oraPrenotazione = new Date();
                        oraPrenotazione.setHours(h, m, 0, 0);
                        if (oraPrenotazione > oraCorrente) {
                            orariDisponibili.push(ora);
                        }
                    });
                } else {
                    // Altrimenti mostra sia pranzo che cena
                    orariDisponibili.push(...orariCena);
                }
            } 
            // Per i giorni successivi
            else {
                orariDisponibili.push(...orariPranzo, ...orariCena);
            }
        }
        
        console.log('Orari disponibili:', orariDisponibili);
        
        // Aggiungi gli orari al menu a tendina
        if (orariDisponibili.length > 0) {
            orariDisponibili.forEach(ora => {
                const option = document.createElement('option');
                option.value = ora;
                option.textContent = ora;
                oraSelect.appendChild(option);
            });
        } else {
            oraSelect.innerHTML = '<option value="">Nessun orario disponibile</option>';
            oraSelect.disabled = true;
        }
        
        // Se è lunedì, mostra un messaggio informativo
        if (isLunedi) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-message';
            infoDiv.textContent = 'Il lunedì siamo aperti solo a pranzo';
            infoDiv.style.color = '#228B22';
            infoDiv.style.marginTop = '10px';
            infoDiv.style.fontStyle = 'italic';
            
            // Rimuovi il messaggio precedente se esiste
            const oldInfo = document.querySelector('.info-message');
            if (oldInfo) oldInfo.remove();
            
            // Aggiungi il nuovo messaggio
            oraSelect.insertAdjacentElement('afterend', infoDiv);
        } else {
            // Rimuovi il messaggio se non è lunedì
            const oldInfo = document.querySelector('.info-message');
            if (oldInfo) oldInfo.remove();
        }
    }
    
    // Inizializza gli orari al caricamento
    aggiornaOrari();
});
