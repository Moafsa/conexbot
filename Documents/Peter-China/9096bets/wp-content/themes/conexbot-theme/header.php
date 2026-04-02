<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <!-- Removido o header visual do tema esquelético antigo; a Home assume os imports -->
    <?php wp_head(); ?>
</head>
<body <?php body_class('la-mask'); ?>>
<?php wp_body_open(); ?>
