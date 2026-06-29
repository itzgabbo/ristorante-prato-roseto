// Gestione del form di prenotazione
document.addEventListener('DOMContentLoaded', function() {
    const prenotazioneForm = document.getElementById('prenotazioneForm');
    
    if (prenotazioneForm) {
        prenotazioneForm.addEventListener('submit', function(e) {
            // Validazione del numero di telefono
            const telefonoInput = document.getElementById('telefono');
            if (telefonoInput) {
                const telefonoPulito = cleanPhoneNumber(telefonoInput.value);
                if (telefonoPulito.length < 9 || telefonoPulito.length > 13) {
                    e.preventDefault();
                    alert('Inserisci un numero di telefono valido (tra 9 e 13 cifre)');
                    telefonoInput.focus();
                    return false;
                }
            }
            
            // Validazione della data
            const dataInput = document.getElementById('data');
            if (dataInput && !dataInput.value) {
                e.preventDefault();
                alert('Seleziona una data per la prenotazione');
                dataInput.focus();
                return false;
            }
            
            // Validazione dell'ora
            const oraInput = document.getElementById('ora');
            if (oraInput && !oraInput.value) {
                e.preventDefault();
                alert('Seleziona un\'orario per la prenotazione');
                oraInput.focus();
                return false;
            }
            
            // Se tutto è valido, il form verrà inviato
            return true;
        });
    }
    
    // Funzione per pulire e validare il numero di telefono
    function cleanPhoneNumber(phone) {
        // Rimuovi tutti i caratteri non numerici
        return phone.replace(/\D/g, '');
    }
});
