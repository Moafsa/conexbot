(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // 1. Botão Desconectar
        const btnDisconnect = document.getElementById('conexbot-disconnect');
        if (btnDisconnect) {
            btnDisconnect.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Deseja realmente desconectar sua conta? A automação e o CRM pararão de funcionar.')) {
                    var data = new FormData();
                    data.append('action', 'conexbot_disconnect');
                    data.append('security', conexbotAdmin.nonceSave);

                    fetch(conexbotAdmin.ajaxurl, { method: 'POST', body: data })
                    .then(() => window.location.reload());
                }
            });
        }

        // 2. Salvar Configurações (Bot ID)
        const btnSave = document.getElementById('conexbot-save-settings');
        if (btnSave) {
            btnSave.addEventListener('click', function() {
                const botIdInput = document.getElementById('conexbot-bot-id');
                const botId = botIdInput ? botIdInput.value : '';
                
                var data = new FormData();
                data.append('action', 'conexbot_save_setup');
                data.append('token', conexbotAdmin.token);
                data.append('bot_id', botId);
                data.append('security', conexbotAdmin.nonceSetup);

                const originalText = btnSave.textContent;
                btnSave.textContent = 'Salvando...';
                btnSave.disabled = true;

                fetch(conexbotAdmin.ajaxurl, { method: 'POST', body: data })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        alert('Configurações salvas!');
                        window.location.reload();
                    } else {
                        alert('Erro ao salvar: ' + (res.data || 'Falha no servidor.'));
                        btnSave.textContent = originalText;
                        btnSave.disabled = false;
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Erro de conexão.');
                    btnSave.textContent = originalText;
                    btnSave.disabled = false;
                });
            });
        }

        // 3. Sincronização em Massa
        const btnBulkSync = document.getElementById('conexbot-bulk-sync');
        if (btnBulkSync) {
            btnBulkSync.addEventListener('click', function() {
                if (confirm('Deseja enviar todos os seus produtos publicados para a inteligência artificial agora?')) {
                    var data = new FormData();
                    data.append('action', 'conexbot_bulk_sync_ajax');
                    data.append('security', conexbotAdmin.nonceSave);

                    const originalText = btnBulkSync.textContent;
                    btnBulkSync.textContent = 'Sincronizando...';
                    btnBulkSync.disabled = true;

                    fetch(conexbotAdmin.ajaxurl, { method: 'POST', body: data })
                    .then(r => r.json())
                    .then(res => {
                        alert(res.data.message);
                        btnBulkSync.textContent = originalText;
                        btnBulkSync.disabled = false;
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Erro na sincronização.');
                        btnBulkSync.textContent = originalText;
                        btnBulkSync.disabled = false;
                    });
                }
            });
        }

        // 4. Onboarding Message Listener
        window.addEventListener('message', function(event) {
            if (event.origin !== "https://app.conext.click" && event.origin !== "http://localhost:3000") return;
            
            if (event.data && event.data.type === 'CONEXBOT_AUTH' && event.data.token) {
                var data = new FormData();
                data.append('action', 'conexbot_save_token_ajax');
                data.append('token', event.data.token);
                data.append('security', conexbotAdmin.nonceSave);

                fetch(conexbotAdmin.ajaxurl, { method: 'POST', body: data })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        window.location.href = conexbotAdmin.dashboardUrl;
                    } else {
                        alert('Erro ao salvar conexão: ' + (res.data || 'Erro desconhecido.'));
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Erro de comunicação com o servidor WP.');
                });
            }
        });
    });
})();
