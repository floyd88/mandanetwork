try {
    console.log('we loaded');

    $('.wpbdp-listing').each(function(idx, el) {
        var parts = $(el).attr('id').split('-'),
            id = parts[parts.length-1];
        console.log(id);
    });

} catch(e) {
    console.log('we goofed');
    console.log(e);
}
