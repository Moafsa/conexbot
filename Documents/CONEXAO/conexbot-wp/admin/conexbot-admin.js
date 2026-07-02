/**
 * Conexbot — painel WordPress (sem inline PHP no JS).
 */
(function () {
    'use strict';

    function init() {
        if (typeof conexbotAdmin === 'undefined') {
            return;
        }
        var ajaxurl = conexbotAdmin.ajaxurl;

        var disconnect = document.getElementById('conexbot-disconnect');
        if (disconnect) {
            disconnect.addEventListener('click', function (e) {
                e.preventDefault();
                if (!confirm('Deseja realmente desconectar sua conta? A automação e o CRM pararão de funcionar.')) {
                    return;
                }
                var data = new FormData();
                data.append('action', 'conexbot_disconnect');
                data.append('security', conexbotAdmin.nonceSave);
                fetch(ajaxurl, { method: 'POST', body: data }).then(function () {
                    window.location.reload();
                });
            });
        }

        var saveBtn = document.getElementById('conexbot-save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var botInput = document.getElementById('conexbot-bot-id');
                var botId = botInput ? botInput.value : '';
                var data = new FormData();
                data.append('action', 'conexbot_save_setup');
                data.append('token', conexbotAdmin.token);
                data.append('bot_id', botId);
                data.append('security', conexbotAdmin.nonceSetup);
                var originalText = saveBtn.textContent;
                saveBtn.textContent = 'Salvando...';
                saveBtn.disabled = true;
                fetch(ajaxurl, { method: 'POST', body: data })
                    .then(function (r) {
                        return r.json();
                    })
                    .then(function (res) {
                        if (res.success) {
                            alert('Configurações salvas!');
                            window.location.reload();
                        } else {
                            var errMsg =
                                res.data && typeof res.data === 'object' && res.data.message
                                    ? res.data.message
                                    : typeof res.data === 'string'
                                      ? res.data
                                      : 'Não foi possível salvar.';
                            alert('Erro ao salvar: ' + errMsg);
                            saveBtn.textContent = originalText;
                            saveBtn.disabled = false;
                        }
                    })
                    .catch(function () {
                        alert('Erro de rede ao salvar.');
                        saveBtn.textContent = originalText;
                        saveBtn.disabled = false;
                    });
            });
        }

        var bulk = document.getElementById('conexbot-bulk-sync');
        if (bulk) {
            bulk.addEventListener('click', function () {
                if (!confirm('Deseja enviar todos os seus produtos publicados para a inteligência artificial agora?')) {
                    return;
                }
                var data = new FormData();
                data.append('action', 'conexbot_bulk_sync_ajax');
                data.append('security', conexbotAdmin.nonceSave);
                var originalBulk = bulk.textContent;
                bulk.textContent = 'Sincronizando...';
                bulk.disabled = true;
                fetch(ajaxurl, { method: 'POST', body: data })
                    .then(function (r) {
                        return r.json();
                    })
                    .then(function (res) {
                        if (res.data && res.data.message) {
                            alert(res.data.message);
                        } else {
                            alert('Sincronização concluída.');
                        }
                        bulk.textContent = originalBulk;
                        bulk.disabled = false;
                    })
                    .catch(function () {
                        bulk.textContent = originalBulk;
                        bulk.disabled = false;
                        alert('Erro de rede.');
                    });
            });
        }

        if (document.getElementById('conexbot-onboarding-iframe')) {
            window.addEventListener('message', function (event) {
                if (event.origin !== 'https://app.conext.click' && event.origin !== 'http://localhost:3000') {
                    return;
                }
                if (!event.data || event.data.type !== 'CONEXBOT_AUTH' || !event.data.token) {
                    return;
                }
                var data = new FormData();
                data.append('action', 'conexbot_save_token_ajax');
                data.append('token', event.data.token);
                data.append('security', conexbotAdmin.nonceSave);
                fetch(ajaxurl, { method: 'POST', body: data })
                    .then(function (r) {
                        return r.json();
                    })
                    .then(function (res) {
                        if (res.success) {
                            window.location.href = conexbotAdmin.dashboardUrl;
                        } else {
                            var msg =
                                res.data && typeof res.data === 'object' && res.data.message
                                    ? res.data.message
                                    : typeof res.data === 'string'
                                      ? res.data
                                      : 'Erro ao salvar conexão.';
                            alert(msg);
                        }
                    })
                    .catch(function () {
                        alert('Erro de rede ao salvar.');
                    });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
