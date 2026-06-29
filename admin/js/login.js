// Controlla se l'utente è già autenticato
if (Auth.isAuthenticated()) {
    // Usiamo replace per evitare di inserire la pagina di login nella cronologia
    window.location.replace('dashboard.html');
    // Interrompiamo l'esecuzione dello script
    throw new Error('Utente già autenticato, reindirizzamento in corso...');
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!loginForm) {
        console.error('Form di login non trovato');
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validazione di base
        if (!email || !password) {
            showError('Inserisci email e password');
            return;
        }
        
        // Mostra l'indicatore di caricamento
        setLoading(true);
        
        try {
            const result = await Auth.login(email, password);
            
            if (result.success) {
                // Pulisci eventuali messaggi di errore
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
                
                // Reindirizza alla dashboard
                window.location.replace('dashboard.html');
            } else {
                showError(result.message || 'Credenziali non valide');
            }
        } catch (error) {
            console.error('Errore durante il login:', error);
            showError(error.message || 'Si è verificato un errore durante il login. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    });
    
    function showError(message) {
        if (!errorMessage) {
            console.error('Elemento error-message non trovato');
            return;
        }
        
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Assicurati che l'elemento sia visibile
        errorMessage.style.opacity = '1';
        
        // Nascondi il messaggio dopo 5 secondi
        setTimeout(() => {
            if (errorMessage) {
                errorMessage.style.opacity = '0';
                setTimeout(() => {
                    if (errorMessage) {
                        errorMessage.style.display = 'none';
                    }
                }, 300);
            }
        }, 5000);
    }
    
    function setLoading(isLoading) {
        const submitButton = loginForm?.querySelector('button[type="submit"]');
        const submitButtonText = submitButton?.querySelector('span');
        
        if (isLoading) {
            if (submitButton) {
                submitButton.disabled = true;
                if (submitButtonText) {
                    submitButtonText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso in corso...';
                }
            }
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
        } else {
            if (submitButton) {
                submitButton.disabled = false;
                if (submitButtonText) {
                    submitButtonText.textContent = 'Accedi';
                }
            }
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }
});
