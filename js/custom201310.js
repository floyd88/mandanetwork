try {

    var PATH = '/13thacg/wp-admin/admin-ajax.php',
        cache = {};

    function getPosts(ids, callback) {
        var url = PATH + '?action=get_mandanetwork_exhibitors';
        url += '&post_ids=' + ids.join(',');
        $.ajax({
            type: 'GET',
            url: url,
            success: function(resp, txtStatus, xhr) {
                callback(resp);
            }
        });
    };

    function getMeta(callback) {
        if (cache.user_meta) {
            return callback(cache.user_meta);
        }
        $.ajax({
            type: 'GET',
            dataType : 'json',
            url: PATH + '?action=get_mandanetwork_user_meta',
            success: function(resp, txtStatus, xhr) {
                // cache user meta on first call so subsequent updates are
                // faster
                cache.user_meta = resp;
                callback(resp);
            }
        });
    };

    function updateMeta(data, callback) {
        console.log('updateMeta data', data);
        $.ajax({
            type: 'POST',
            dataType : 'json',
            url: PATH,
            data: ({
                action : 'update_mandanetwork_user_meta',
                data: data
            }),
            success: function(resp) {
                cache.user_meta = {success:true, data:[data]};
                callback(resp);
            }
        });
    };

    function onClickCheckbox(ev) {
        var $el = $(this),
            $input = $el.find('input'),
            checked = $input.is(':checked'),
            id = $input.attr('data-id'),
            name = $input.attr('name');

        function handleError(e) {
            if (e) console.log(e);
            if (e && e.stack) console.log(e.stack);
            // return to original checked setting if error
            return $input.prop('checked', !checked);
        };

        // merge with existing data
        getMeta(function(resp) {
            var data = {};
            console.log('getMeta resp', JSON.stringify(resp,null,2));
            if (typeof resp === 'object' && resp.success) {
                data = resp.data[0] || {};
            } else {
                return handleError();
            }
            if (!data[id]) {
                data[id] = {};
            }
            // set and save checked value for this exhibitor id
            data[id][name] = checked;
            //$input.attr('disabled', 'disabled');
            updateMeta(data, function(resp) {
                console.log('updateMeta resp', resp);
                //$input.attr('disabled', false);
                if (typeof resp !== 'object' || !resp.success) {
                    return handleError();
                }
                console.log('saved', id, name, checked);
            });
        });

    };

    function isVisited(data) {
        if (!data || !data.visited) {
            return false;
        }
        if (data.visited == true || data.visited == "true") {
            return true;
        }
    }

    function isSelected(data) {
        if (!data || !data.selected) {
            return false;
        }
        if (data.selected == true || data.selected == "true") {
            return true;
        }
    }

    function addSelectElementsToListing(el, id, data) {
        console.log('addSelectedElementsToListing', id, data);

        var checked = isSelected(data) ? ' checked="checked"' : '';
        var selected = $(
            '<div><label for="selected">Selected '
            + '<input type="checkbox" name="selected" data-id="'+id+'"'
            + checked + ' /></label></div>'
        ).on('click', onClickCheckbox);

        checked = isVisited(data) ? ' checked="checked"' : '';
        var visited  = $(
            '<div><label for="visited">Visited '
            + '<input type="checkbox" name="visited" data-id="'+id+'"'
            + checked + ' /></label></div>'
        ).on('click', onClickCheckbox);
        var div = $('<div class=".field-value" />')
            .append(selected).append(visited);
        $(el).find('.field-value').last().after(div);
    };

    function onClickSelectedListings(ev) {
        getMeta(function(resp) {
            var ids = [];
            $.each(resp.data[0], function(key, val) {
                if (isSelected(val)) {
                    ids.push(key);
                }
            });
            getPosts(ids, function(resp) {
                $('.wpbdp-view-listings-page .listings').html(resp);
                initExcerpts();
            });
        });
    }

    function onClickVisitedListings(ev) {
        getMeta(function(resp) {
            var ids = [];
            $.each(resp.data[0], function(key, val) {
                if (isVisited(val)) {
                    ids.push(key);
                }
            });
            getPosts(ids, function(resp) {
                $('.wpbdp-view-listings-page .listings').html(resp);
                initExcerpts();
            });
        });
    }

    var selBtn = $(
        '<input id="wpbdp-bar-show-selected-button" type="button"'
        + ' value="Selected Listings" class="button" />'
    ).on('click', onClickSelectedListings).appendTo($('.wpbdp-main-links'));

    var visBtn = $(
        '<input id="wpbdp-bar-show-visited-button" type="button"'
        + ' value="Visited Listings" class="button" />'
    ).on('click', onClickVisitedListings).appendTo($('.wpbdp-main-links'));

    function initExcerpts() {
        getMeta(function(resp) {
            if (typeof resp !== 'object' || !resp.success) {
                // request failed
                return;
            }
            $('.wpbdp-listing').each(function(idx, el) {
                var parts = $(el).attr('id').split('-'),
                    id = parts[parts.length-1],
                    data = resp.data[0] || {};
                addSelectElementsToListing(el, id, data[id] || {});
            });
        });
    }

    initExcerpts();

} catch(e) {
    console.log('oops');
    console.log(e);
    console.log(e.stack);
}
