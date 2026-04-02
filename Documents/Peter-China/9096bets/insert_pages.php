<?php
require_once('wp-load.php');

$pages = [
    ['title' => 'Cassino', 'slug' => 'cassino', 'template' => 'page-cassino.php'],
    ['title' => 'Slots', 'slug' => 'slots', 'template' => 'page-slots.php']
];

foreach ($pages as $p) {
    if (!get_page_by_path($p['slug'])) {
        $page_id = wp_insert_post([
            'post_title' => $p['title'],
            'post_name' => $p['slug'],
            'post_status' => 'publish',
            'post_type' => 'page'
        ]);
        if ($page_id) {
            update_post_meta($page_id, '_wp_page_template', $p['template']);
            echo "Página " . $p['title'] . " criada com sucesso!\n";
        }
    } else {
        echo "Página " . $p['title'] . " já existe.\n";
    }
}
