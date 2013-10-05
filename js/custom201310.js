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

    function onChangeSelectOption(ev) {
        var $el = $(this),
            $select = $el.find('select'),
            state = $select.find('option:selected').val(),
            id = $select.attr('data-id');

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
            // set and state value for this exhibitor id
            data[id]['state'] = state;
            //$select.attr('disabled', 'disabled');
            updateMeta(data, function(resp) {
                console.log('updateMeta resp', resp);
                //$input.attr('disabled', false);
                if (typeof resp !== 'object' || !resp.success) {
                    return handleError();
                }
                console.log('saved', id, state);
                updateCounts(data);
            });
        });

    };

    function getSelectedCount(data) {
        var cnt = 0;
        $.each(data, function(key, val) {
            if (val.state && val.state === "selected") {
                cnt++;
            }
        });
        return cnt;
    }

    function getVisitedCount(data) {
        var cnt = 0;
        $.each(data, function(key, val) {
            if (val.state && val.state === "visited") {
                cnt++;
            }
        });
        return cnt;
    }

    function isVisited(data) {
        if (data && data.state && data.state == "visited") {
            return true;
        }
    }

    function isSelected(data) {
        if (data && data.state && data.state == "selected") {
            return true;
        }
    }

    function addSelectElementsToListing(el, id, data) {
        console.log('addSelectedElementsToListing', id, data);

        var s_attrs = isSelected(data) ? ' selected="selected"' : '';
        var v_attrs = isVisited(data) ? ' selected="selected"' : '';
        var state = $(
            '<div>'
            + '<select name="state" data-id="'+id+'">'
            + '<option value=""></option>'
            + '<option value="selected" ' + s_attrs + '>Selected</option>'
            + '<option value="visited" ' + v_attrs + '>Visited</option>'
            + '</select></div>'
        ).on('change', onChangeSelectOption);

        var div = $('<div class=".field-value" />').append(state);
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

    var $selBtn = $(
        '<input id="wpbdp-bar-show-selected-button" type="button"'
        + ' value="Selected Listings" class="button" />'
    ).on('click', onClickSelectedListings).appendTo($('.wpbdp-main-links'));

    var $visBtn = $(
        '<input id="wpbdp-bar-show-visited-button" type="button"'
        + ' value="Visited Listings" class="button" />'
    ).on('click', onClickVisitedListings).appendTo($('.wpbdp-main-links'));

    function updateCounts(data) {
        $selBtn.attr(
            'value', 'Selected Listings ('+ getSelectedCount(data) + ')'
        );
        $visBtn.attr(
            'value', 'Visited Listings ('+ getVisitedCount(data) + ')'
        );
    }

    function initExcerpts() {
        getMeta(function(resp) {
            if (typeof resp !== 'object' || !resp.success) {
                // request failed
                return console.log('request failed', resp);
            }
            var data = resp.data[0] || {};
            updateCounts(data);
            $('.wpbdp-listing').each(function(idx, el) {
                var parts = $(el).attr('id').split('-'),
                    id = parts[parts.length-1];
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
