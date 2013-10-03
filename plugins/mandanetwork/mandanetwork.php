<?php
   /*
   Plugin Name: Manda Network Wordpress Plugin
   Plugin URI: https://github.com/floyd88/mandanetwork
   Version: 0.1
   License: GPL2

   Send POST to /wp-admin/admin-ajax.php
   Define `data` and `action`
   */

/* action = update_mandanetwork_user_meta */
function update_mandanetwork_user_meta() {
    update_user_meta(get_current_user_id(), 'mandanetwork', $_POST['data']);
    wp_send_json_success();
    wp_die(0);
}

/* action = get_mandanetwork_user_meta */
function get_mandanetwork_user_meta() {
    $data = get_user_meta(get_current_user_id(), 'mandanetwork');
    wp_send_json_success($data);
    wp_die(0);
}

function must_login() {
    echo "You must log in to vote";
    wp_die(0);
}

add_action("wp_ajax_update_mandanetwork_user_meta", "update_mandanetwork_user_meta");
add_action("wp_ajax_get_mandanetwork_user_meta", "get_mandanetwork_user_meta");

add_action("wp_ajax_nopriv_update_mandanetwork_user_meta", "must_login");
add_action("wp_ajax_nopriv_get_mandanetwork_user_meta", "must_login");

?>
