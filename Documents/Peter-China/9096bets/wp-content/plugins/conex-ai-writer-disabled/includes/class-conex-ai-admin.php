<?php
if (!defined('ABSPATH')) {
    exit;
}

class ConexAI_Admin {
    public function init() {
        add_action('admin_menu', [$this, 'add_menu_page']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function add_menu_page() {
        add_menu_page(
            'Conex AI Writer',
            'Conex AI Writer',
            'manage_options',
            'conex-ai-writer',
            [$this, 'render_admin_page'],
            'dashicons-superhero',
            65
        );
    }

    public function register_settings() {
        register_setting('conex_ai_settings', 'conex_ai_openai_key');
        register_setting('conex_ai_settings', 'conex_ai_gemini_key');
        register_setting('conex_ai_settings', 'conex_ai_news_source');
    }

    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>Configurações: Conex AI Writer</h1>
            <p>Configure as chaves de API e preferências do Orquestrador Híbrido.</p>
            <form method="post" action="options.php">
                <?php settings_fields('conex_ai_settings'); ?>
                <?php do_settings_sections('conex_ai_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">OpenAI API Key</th>
                        <td><input type="password" name="conex_ai_openai_key" value="<?php echo esc_attr(get_option('conex_ai_openai_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Google Gemini API Key</th>
                        <td><input type="password" name="conex_ai_gemini_key" value="<?php echo esc_attr(get_option('conex_ai_gemini_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Fontes de Notícias (Híbrido)</th>
                        <td>
                            <textarea name="conex_ai_news_source" rows="5" class="large-text code" placeholder="Cole URLs de fontes (uma por linha) ou deixe em branco para busca 100% automática">
<?php echo esc_textarea(get_option('conex_ai_news_source')); ?>
                            </textarea>
                            <p class="description">Deixe em branco para permitir que o Agente Pesquisador busque automaticamente usando a Web Search da IA.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
