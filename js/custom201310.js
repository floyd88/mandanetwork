try {
    console.log('we loaded');

    function updateProfile(data, callback) {
        $.ajax({
            type:"POST",
            url: "/wp-admin/admin-ajax.php",
            data: ({
                action : 'update',
                aim: JSON.stringify(data),
                user_id: 3,
                submit: 'Update Profile',
                checkuser_id: 3
            }),
            success: callback
        });
    };

    function onClickCheckbox(ev) {
        var $el = $(this),
            checked = $el.find('input').is(':checked'),
            id = $el.find('input').attr('data-id'),
            name = $el.find('input').attr('name'),
            data = {};

        console.log('clicked', id, name, checked);
        // e.g. {1234: {visited: true, selected:false}}
        data[id] = {}
        data[id][name] = checked;

        updateProfile(data, function(err, data) {
            if (err) {
                console.log('error', err);
                // if error just uncheck
                return $el.find('input').prop('checked', false);
            }
            console.log('success ajax');
        });
    };

    function addSelectElementsToListing(el, id) {
        var selected = $(
            '<div><label for="selected">Selected '
            + '<input type="checkbox" name="selected" data-id="'+id+'"/>'
            + '</label></div>'
        ).on('click', onClickCheckbox);
        var visited  = $(
            '<div><label for="visited">Visited '
            + '<input type="checkbox" name="selected" data-id="'+id+'"/>'
            + '</label></div>'
        ).on('click', onClickCheckbox);
        var div = $('<div class=".field-value" />')
            .append(selected).append(visited);
        $(el).find('.field-value').last().after(div);
    };
    $('.wpbdp-listing').each(function(idx, el) {
        var parts = $(el).attr('id').split('-'),
            id = parts[parts.length-1];
        addSelectElementsToListing(el, id);
        console.log(id);
    });

} catch(e) {
    console.log('oops');
    console.log(e);
    console.log(e.stack);
}
