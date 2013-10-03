try {

    function getMeta(callback) {
        $.ajax({
            type:"GET",
            dataType : "json",
            url: "/wp-admin/admin-ajax.php?action=get_mandanetwork_user_meta",
            success: callback
        });
    };

    function updateMeta(data, callback) {
        $.ajax({
            type:"POST",
            dataType : "json",
            url: "/wp-admin/admin-ajax.php",
            data: ({
                action : 'update_mandanetwork_user_meta',
                data: JSON.stringify(data)
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

        getMeta(function(resp) {
            if(resp.type == "success") {
                console.log("success");
            } else {
                console.log("error");
                console.log('getMeta resp', resp);
            }
        });

        console.log('clicked', id, name, checked);
        // e.g. {1234: {visited: true, selected:false}}
        data[id] = {}
        data[id][name] = checked;

        updateMeta(data, function(results) {
            //console.log('results', results);
            // if error just uncheck
            //return $el.find('input').prop('checked', false);
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
            + '<input type="checkbox" name="visited" data-id="'+id+'"/>'
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
