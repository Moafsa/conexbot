<?php

if (!defined('ABSPATH')) {
    exit;
}

class Conext_Agent_Visualist {
    
    private $provider;

    public function __construct($provider_config) {
        $this->provider = $provider_config;
    }

    public function generate_images($keywords, $count = 1) {
        $style_key = get_option('conext_writer_image_style', '3d_render');
        $styles = [
            '3d_render' => 'Style: 3D Render, Vibrant Colors, 4k, Clean design, no text. Theme: Gaming, Modern E-commerce UI, Premium feel.',
            'photorealistic' => 'Style: Photorealistic, high quality, 8k, professional photography, cinematic lighting, sharp focus, natural colors, realistic textures, no text.',
            'flat_illustration' => 'Style: Flat illustration, minimalist, vector art, clean lines, corporate colors, modern branding style, no text.',
            'cyberpunk' => 'Style: Cyberpunk, neon lights, futuristic city vibes, dark background, synthwave colors, digital art, high contrast, no text.',
            'isometric' => 'Style: Isometric 3D perspective, clean geometry, soft lighting, minimalist scene, pastel colors, professional digital art, no text.'
        ];
        
        $style_prompt = isset($styles[$style_key]) ? $styles[$style_key] : $styles['3d_render'];
        $search_terms = get_option('conext_writer_search_terms');

        $prompt = "Professional high-conversion featured image for a blog post about: " . $keywords . ". ";
        if (!empty($search_terms)) {
            $prompt .= "Thematic inspiration: " . $search_terms . ". ";
        }
        $prompt .= $style_prompt;

        $ids = [];
        for ($i = 0; $i < $count; $i++) {
            $image_url = Conext_API::generate_image($prompt, $this->provider);
            
            if (!$image_url) {
                error_log('Conext Writer Visualist Error: Falha ao gerar URL da imagem ' . ($i + 1));
                continue;
            }

            $id = $this->sideload_image($image_url, $keywords . " " . ($i + 1));
            if ($id) {
                $ids[] = $id;
            }
        }
        
        return $ids;
    }

    private function sideload_image($url, $keywords) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $desc = "Imagem gerada por IA para: " . $keywords;
        $file_array = array();
        $file_array['name'] = sanitize_title($keywords) . ".jpg";

        // Download file to temp location
        $file_array['tmp_name'] = download_url($url);

        if (is_wp_error($file_array['tmp_name'])) {
            error_log('Conext Writer Visualist Error: Falha no download da imagem IA.');
            return 0;
        }

        // Do the real sideload
        $id = media_handle_sideload($file_array, 0, $desc);

        if (is_wp_error($id)) {
            @unlink($file_array['tmp_name']);
            error_log('Conext Writer Visualist Error: Falha ao inserir imagem na galeria.');
            return 0;
        }

        return $id;
    }
}
