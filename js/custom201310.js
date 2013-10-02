try {
    console.log('we loaded');

    $('.wpbdp-listing').each(function(idx, el) {
        console.log($(el).attr('id'));
        console.log(idx);
    });

} catch(e) {
    console.log('we goofed');
    console.log(e);
}
