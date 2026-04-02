<?php
function conexbot_theme_enqueue_styles() {
    wp_enqueue_style( 'conexbot-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version') );
}
add_action( 'wp_enqueue_scripts', 'conexbot_theme_enqueue_styles' );

// Add standard theme support
function conexbot_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
}
add_action('after_setup_theme', 'conexbot_theme_setup');
