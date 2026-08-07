<?php
/**
 * Private (post-sale) Messages View
 *
 * Separate from the public pre-sale Q&A (Perguntas): this is /messages/received, the
 * private per-order messaging thread. It's the ONLY message stream this plugin can answer
 * automatically via AI (hourly cron, "Respostas Automáticas" in Configurações) — but until
 * this page existed, there was no way to see what came in or what the AI actually replied.
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$table_messages = $wpdb->prefix . 'ts_ml_messages';
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';

// Self-healing: add columns for sites whose ts_ml_messages table predates them.
foreach (array('reply_text' => 'text', 'replied_via' => 'varchar(10)') as $column => $type) {
    $exists = $wpdb->get_results("SHOW COLUMNS FROM $table_messages LIKE '$column'");
    if (empty($exists)) {
        $wpdb->query("ALTER TABLE $table_messages ADD COLUMN $column $type");
    }
}

// Manual "sync now" instead of waiting for the hourly cron
if (isset($_POST['sync_now']) && check_admin_referer('ts_ml_sync_private_messages')) {
    $accounts_to_sync = $wpdb->get_results("SELECT id FROM $table_accounts WHERE is_active = 1");
    $handler = TS_ML_Message_Handler::instance();
    foreach ($accounts_to_sync as $acc) {
        $handler->sync_account_messages($acc->id);
    }
    echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Mensagens sincronizadas do Mercado Livre.', 'ts-ml-integration') . '</p></div>';
}

// Manual "answer now with AI" for a specific message still unread
if (isset($_GET['answer_with_ai']) && check_admin_referer('ts_ml_answer_with_ai_' . $_GET['answer_with_ai'])) {
    $message_id = intval($_GET['answer_with_ai']);
    $success = TS_ML_Message_Handler::instance()->send_reply($message_id, '');
    if ($success) {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Resposta enviada via IA.', 'ts-ml-integration') . '</p></div>';
    } else {
        echo '<div class="notice notice-error is-dismissible"><p>' . esc_html__('Falha ao enviar resposta. Confira se a chave de IA está configurada em Configurações.', 'ts-ml-integration') . '</p></div>';
    }
}

$ai_enabled = get_option('ts_ml_ai_enabled') === 'yes';
$ai_key_configured = !empty(get_option('ts_ml_ai_api_key'));

$messages = $wpdb->get_results(
    "SELECT m.*, a.account_name
     FROM $table_messages m
     LEFT JOIN $table_accounts a ON a.id = m.account_id
     ORDER BY m.created_at DESC
     LIMIT 100"
);
?>

<div class="wrap">
    <h1><?php esc_html_e('Mensagens Privadas (Pós-venda)', 'ts-ml-integration'); ?></h1>

    <div class="notice notice-info" style="padding: 12px 16px;">
        <p style="margin: 0;">
            <?php esc_html_e('Estas são as mensagens privadas dentro de um pedido (diferente das Perguntas públicas pré-venda). São verificadas automaticamente a cada hora.', 'ts-ml-integration'); ?>
            <?php if ($ai_enabled && $ai_key_configured) : ?>
                <strong style="color: #047857;"><?php esc_html_e('Resposta automática via IA: ATIVA.', 'ts-ml-integration'); ?></strong>
            <?php elseif ($ai_enabled && !$ai_key_configured) : ?>
                <strong style="color: #d63638;"><?php esc_html_e('Resposta automática via IA está ativada em Configurações, mas nenhuma chave de API foi configurada — as respostas não estão sendo enviadas.', 'ts-ml-integration'); ?></strong>
            <?php else : ?>
                <strong style="color: #92400e;"><?php esc_html_e('Resposta automática via IA está DESATIVADA. Ative em Configurações > Inteligência Artificial para responder automaticamente.', 'ts-ml-integration'); ?></strong>
            <?php endif; ?>
        </p>
    </div>

    <form method="post" action="" style="margin: 15px 0;">
        <?php wp_nonce_field('ts_ml_sync_private_messages'); ?>
        <input type="submit" name="sync_now" class="button button-primary" value="<?php esc_attr_e('🔄 Sincronizar Agora (não esperar a próxima hora)', 'ts-ml-integration'); ?>" />
    </form>

    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th style="width: 130px;"><?php esc_html_e('Data', 'ts-ml-integration'); ?></th>
                <th><?php esc_html_e('Mensagem do Cliente', 'ts-ml-integration'); ?></th>
                <th><?php esc_html_e('Resposta Enviada', 'ts-ml-integration'); ?></th>
                <th style="width: 110px;"><?php esc_html_e('Status', 'ts-ml-integration'); ?></th>
                <th style="width: 140px;"><?php esc_html_e('Ações', 'ts-ml-integration'); ?></th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($messages)) : ?>
                <tr>
                    <td colspan="5"><?php esc_html_e('Nenhuma mensagem privada recebida ainda.', 'ts-ml-integration'); ?></td>
                </tr>
            <?php else : ?>
                <?php foreach ($messages as $msg) : ?>
                    <tr>
                        <td>
                            <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($msg->created_at))); ?>
                            <br><small style="color: #94a3b8;"><?php echo esc_html($msg->account_name ?: '—'); ?></small>
                        </td>
                        <td><?php echo esc_html($msg->message_text); ?></td>
                        <td>
                            <?php if (!empty($msg->reply_text)) : ?>
                                <?php echo esc_html($msg->reply_text); ?>
                                <br><small style="color: <?php echo $msg->replied_via === 'ai' ? '#047857' : '#64748b'; ?>;">
                                    <?php echo $msg->replied_via === 'ai' ? '🤖 ' . esc_html__('via IA', 'ts-ml-integration') : '✍️ ' . esc_html__('manual', 'ts-ml-integration'); ?>
                                </small>
                            <?php else : ?>
                                <span style="color: #94a3b8;">—</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="status-<?php echo esc_attr($msg->status); ?>">
                                <?php echo $msg->status === 'replied' ? '✅ ' . esc_html__('Respondida', 'ts-ml-integration') : '⏳ ' . esc_html__('Não respondida', 'ts-ml-integration'); ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($msg->status !== 'replied') : ?>
                                <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-private-messages&answer_with_ai=' . $msg->id), 'ts_ml_answer_with_ai_' . $msg->id)); ?>" class="button button-small">
                                    🤖 <?php esc_html_e('Responder com IA', 'ts-ml-integration'); ?>
                                </a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>
