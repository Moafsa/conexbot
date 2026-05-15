<?php
/**
 * Messages (Q&A) View
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get accounts
global $wpdb;
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';
$accounts = $wpdb->get_results("SELECT * FROM $table_accounts WHERE is_active = 1");

$current_account_id = isset($_GET['account_id']) ? intval($_GET['account_id']) : (isset($accounts[0]) ? $accounts[0]->id : 0);
?>

<div class="wrap">
    <h1><?php esc_html_e('Perguntas e Respostas - Mercado Livre', 'ts-ml-integration'); ?></h1>

    <?php if (empty($accounts)) : ?>
        <div class="notice notice-error">
            <p><?php esc_html_e('Nenhuma conta conectada.', 'ts-ml-integration'); ?></p>
        </div>
    <?php else : ?>

        <div class="tablenav top">
            <div class="alignleft actions">
                <select id="filter-by-account">
                    <?php foreach ($accounts as $account) : ?>
                        <option value="<?php echo esc_attr($account->id); ?>" <?php selected($current_account_id, $account->id); ?>>
                            <?php echo esc_html($account->account_name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <button type="button" id="load-questions" class="button action"><?php esc_html_e('Atualizar Perguntas', 'ts-ml-integration'); ?></button>
            </div>
            
            <div class="alignleft actions">
                <select id="filter-status">
                     <option value="UNANSWERED">Não Respondidas</option>
                     <option value="ANSWERED">Respondidas</option>
                </select>
            </div>
        </div>

        <div id="ts-ml-qa-list" class="ts-ml-qa-container">
            <!-- Questions will be loaded here -->
            <div style="padding: 20px; text-align: center;">
                <span class="spinner is-active" style="float:none;"></span> Carregando...
            </div>
        </div>

    <?php endif; ?>
</div>

<style>
.ts-ml-qa-item {
    background: #fff;
    border: 1px solid #ccd0d4;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
    margin-bottom: 20px;
    padding: 0;
}
.ts-ml-qa-header {
    background: #f8f9fa;
    border-bottom: 1px solid #ccd0d4;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.ts-ml-qa-body {
    padding: 15px;
}
.ts-ml-question {
    font-weight: bold;
    font-size: 1.1em;
    margin-bottom: 15px;
    color: #1d2327;
}
.ts-ml-product-link {
    font-size: 0.9em;
    color: #2271b1;
    text-decoration: none;
}
.ts-ml-answer-box {
    background: #f0f6fc;
    border: 1px solid #c5ddf9;
    padding: 10px;
    margin-top: 10px;
    border-radius: 4px;
}
.ts-ml-date {
    color: #646970;
    font-size: 0.85em;
}
</style>

<script type="text/javascript">
jQuery(document).ready(function($) {
    
    function loadQuestions() {
        let accountId = $('#filter-by-account').val();
        let status = $('#filter-status').val();
        
        $('#ts-ml-qa-list').html('<div style="padding: 20px; text-align: center;"><span class="spinner is-active" style="float:none;"></span> Carregando...</div>');

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'ts_ml_fetch_questions',
                account_id: accountId,
                status: status,
                nonce: '<?php echo wp_create_nonce('ts_ml_qa_nonce'); ?>'
            },
            success: function(response) {
                if(response.success) {
                    renderQuestions(response.data);
                } else {
                    $('#ts-ml-qa-list').html('<div class="notice notice-error"><p>' + response.data + '</p></div>');
                }
            },
            error: function() {
                $('#ts-ml-qa-list').html('<div class="notice notice-error"><p>Erro ao conectar.</p></div>');
            }
        });
    }

    function renderQuestions(data) {
        if (!data || data.length === 0) {
            $('#ts-ml-qa-list').html('<div class="notice notice-info"><p>Nenhuma pergunta encontrada.</p></div>');
            return;
        }

        let html = '';
        data.forEach(function(q) {
            let answerHtml = '';
            
            if (q.status === 'ANSWERED' && q.answer) {
                answerHtml = `
                    <div class="ts-ml-answer-box">
                        <strong>Sua Resposta:</strong><br>
                        ${q.answer.text}<br>
                        <span class="ts-ml-date">${q.answer.date_created}</span>
                    </div>
                `;
            } else {
                answerHtml = `
                    <div class="ts-ml-reply-area" id="reply-box-${q.id}">
                        <textarea class="large-text" rows="3" placeholder="Escreva sua resposta..."></textarea>
                        <br><br>
                        <button type="button" class="button button-primary send-reply" data-id="${q.id}">Enviar Resposta</button>
                    </div>
                `;
            }

            html += `
                <div class="ts-ml-qa-item">
                    <div class="ts-ml-qa-header">
                        <span>
                            <a href="${q.item.permalink}" target="_blank" class="ts-ml-product-link">
                                ${q.item.title} (${q.item.id})
                            </a>
                        </span>
                        <span class="ts-ml-date">${q.date_created}</span>
                    </div>
                    <div class="ts-ml-qa-body">
                        <div class="ts-ml-question">
                            👤 ${q.text}
                        </div>
                        ${answerHtml}
                    </div>
                </div>
            `;
        });

        $('#ts-ml-qa-list').html(html);
    }

    // Send Reply
    $(document).on('click', '.send-reply', function() {
        let btn = $(this);
        let qId = btn.data('id');
        let container = $('#reply-box-' + qId);
        let text = container.find('textarea').val();
        let accountId = $('#filter-by-account').val();

        if (!text) {
            alert('Escreva uma resposta.');
            return;
        }

        btn.prop('disabled', true).text('Enviando...');

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'ts_ml_send_answer',
                question_id: qId,
                text: text,
                account_id: accountId,
                nonce: '<?php echo wp_create_nonce('ts_ml_qa_nonce'); ?>'
            },
            success: function(response) {
                if(response.success) {
                    container.html(`
                        <div class="notice notice-success inline"><p>Respondido com sucesso!</p></div>
                        <div class="ts-ml-answer-box">
                            <strong>Sua Resposta:</strong><br>
                            ${text}
                        </div>
                    `);
                } else {
                    alert('Erro: ' + response.data);
                    btn.prop('disabled', false).text('Enviar Resposta');
                }
            },
            error: function() {
                alert('Erro de conexão.');
                btn.prop('disabled', false).text('Enviar Resposta');
            }
        });
    });

    // Filtering
    $('#load-questions, #filter-by-account, #filter-status').on('click change', function() {
        if(this.id !== 'load-questions' && this.tagName !== 'SELECT') return; // Avoid double trigger
        loadQuestions();
    });

    // Initial Load
    loadQuestions();
});
</script>
