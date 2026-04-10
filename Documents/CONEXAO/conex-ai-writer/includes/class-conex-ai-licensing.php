<?php
if (!defined('ABSPATH')) {
    exit;
}

class ConexAI_Licensing {

    public static function get_tier_label() {
        $tier = get_option('conex_ai_license_tier', 'free');
        $tiers = [
            'free' => 'Grátis (Teste)',
            'starter' => 'Starter (10 posts)',
            'pro' => 'Gold (50 posts)',
            'unlimited' => 'Enterprise (Ilimitado)'
        ];
        return $tiers[$tier] ?? 'Desconhecido';
    }

    public static function get_credits_remaining() {
        return (int) get_option('conex_ai_credits_remaining', 0);
    }

    public static function get_credits_total() {
        $tier = get_option('conex_ai_license_tier', 'free');
        $totals = [
            'free' => 1,
            'starter' => 10,
            'pro' => 50,
            'unlimited' => 9999
        ];
        return $totals[$tier] ?? 0;
    }

    public static function is_valid() {
        $key = get_option('conex_ai_license_key');
        if (empty($key)) return false;
        
        // Simulação de validação (Em produção, aqui faria um wp_remote_get para conexbot.com/api/check)
        if (strpos($key, 'PRO') === 0) return true;
        if (strpos($key, 'STARTER') === 0) return true;
        if ($key === 'MASTER-9096') return true;

        return false;
    }

    public static function check_and_reset_credits() {
        $last_reset = get_option('conex_ai_last_credit_reset', 0);
        $one_month = 30 * DAY_IN_SECONDS;

        if (time() - $last_reset > $one_month) {
            update_option('conex_ai_credits_remaining', self::get_credits_total());
            update_option('conex_ai_last_credit_reset', time());
        }
    }

    public static function consume_credit() {
        $tier = get_option('conex_ai_license_tier', 'free');
        if ($tier === 'unlimited') return true;

        $current = self::get_credits_remaining();
        if ($current > 0) {
            update_option('conex_ai_credits_remaining', $current - 1);
            return true;
        }
        return false;
    }

    public static function activate_key($key) {
        // Mock de ativação
        $tier = 'free';
        $credits = 1;

        if (strpos($key, 'STARTER') === 0) {
            $tier = 'starter';
            $credits = 10;
        } elseif (strpos($key, 'PRO') === 0) {
            $tier = 'pro';
            $credits = 50;
        } elseif ($key === 'MASTER-9096') {
            $tier = 'unlimited';
            $credits = 9999;
        } else {
            return false;
        }

        update_option('conex_ai_license_key', $key);
        update_option('conex_ai_license_tier', $tier);
        update_option('conex_ai_credits_remaining', $credits);
        update_option('conex_ai_last_credit_reset', time());
        return true;
    }
}
