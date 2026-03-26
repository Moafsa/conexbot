(function($) {
    'use strict';

    $(document).ready(function() {
        // 1. Botão Desconectar
        $('#conexbot-disconnect').on('click', function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente desconectar sua conta? A automação e o CRM pararão de funcionar.')) {
                var data = new FormData();
                data.append('action', 'conexbot_disconnect');
                data.append('security', conexbotData.nonces.save_action);

                fetch(conexbotData.ajaxurl, { method: 'POST', body: data })
                .then(() => window.location.reload());
            }
        });

        // 2. Salvar Configurações (Bot ID)
        $('#conexbot-save-settings').on('click', function() {
            var botId = $('#conexbot-bot-id').val();
            var data = new FormData();
            data.append('action', 'conexbot_save_setup');
            data.append('token', conexbotData.token);
            data.append('bot_id', botId);
            data.append('security', conexbotData.nonces.setup_nonce);

            var $btn = $(this);
            var originalText = $btn.text();
            $btn.text('Salvando...').prop('disabled', true);

            fetch(conexbotData.ajaxurl, { method: 'POST', body: data })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    alert('Configurações salvas!');
                    window.location.reload();
                } else {
                    alert('Erro ao salvar: ' + (res.data || 'Falha no servidor.'));
                    $btn.text(originalText).prop('disabled', false);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Erro de conexão.');
                $btn.text(originalText).prop('disabled', false);
            });
        });

        // 3. Sincronização em Massa
        $('#conexbot-bulk-sync').on('click', function() {
            if (confirm('Deseja enviar todos os seus produtos publicados para a inteligência artificial agora?')) {
                var data = new FormData();
                data.append('action', 'conexbot_bulk_sync_ajax');
                data.append('security', conexbotData.nonces.save_action);

                var $btn = $(this);
                $btn.text('Sincronizando...').prop('disabled', true);

                fetch(conexbotData.ajaxurl, { method: 'POST', body: data })
                .then(r => r.json())
                .then(res => {
                    alert(res.data.message);
                    $btn.text('Sincronizar Tudo').prop('disabled', false);
                })
                .catch(err => {
                    console.error(err);
                    alert('Erro na sincronização.');
                    $btn.text('Sincronizar Tudo').prop('disabled', false);
                });
            }
        });

        // 4. Onboarding Message Listener
        window.addEventListener('message', function(event) {
            if (event.origin !== "https://app.conext.click" && event.origin !== "http://localhost:3000") return;
            
            if (event.data && event.data.type === 'CONEXBOT_AUTH' && event.data.token) {
                var data = new FormData();
                data.append('action', 'conexbot_save_token_ajax');
                data.append('token', event.data.token);
                data.append('security', conexbotData.nonces.save_action);

                fetch(conexbotData.ajaxurl, { method: 'POST', body: data })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        window.location.href = conexbotData.dashboard_url;
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
})(jQuery);
