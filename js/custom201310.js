(function(jQuery) {

    /*! jQuery Ajax Queue v0.1.2pre | (c) 2013 Corey Frang | Licensed MIT */
    (function(e){var r=e({});e.ajaxQueue=function(n){function t(r){u=e.ajax(n),u.done(a.resolve).fail(a.reject).then(r,r)}var u,a=e.Deferred(),i=a.promise();return r.queue(t),i.abort=function(o){if(u)return u.abort(o);var c=r.queue(),f=e.inArray(t,c);return f>-1&&c.splice(f,1),a.rejectWith(n.context||n,[i,o,""]),i},i}})(jQuery);

    var PATH = '/13thacg/wp-admin/admin-ajax.php',
        cache = {},
        $ = jQuery;

    function setCache(key, data) {
        //console.log('setCache', key, data);
        cache[key] = data;
    };

    function getPosts(ids, callback) {
        var url = PATH + '?action=get_mandanetwork_exhibitors';
        url += '&post_ids=' + ids.join(',');
        $.ajaxQueue({
            type: 'GET',
            url: url
        }).done(function(resp, txtStatus, xhr) {
            callback(resp);
        });
    };

    function getMeta(callback) {
        if (cache.user_meta) {
            return callback(cache.user_meta);
        }
        $.ajaxQueue({
            type: 'GET',
            dataType : 'json',
            url: PATH + '?action=get_mandanetwork_user_meta'
        }).done(function(resp, txtStatus, xhr) {
            // cache user meta on first call so subsequent updates are
            // faster
            setCache('user_meta', resp);
            callback(resp);
        });
    };

    function updateMeta(data, callback) {
        $.ajaxQueue({
            type: 'POST',
            dataType : 'json',
            url: PATH,
            data: ({
                action : 'update_mandanetwork_user_meta',
                data: data
            })
        }).done(function(resp) {
            setCache('user_meta', {success:true, data:[data]});
            callback(resp);
        });
    };

    function cycleBtn(ev) {
        ev.preventDefault();
        var $btn = $(this).find('.btn'),
            state = $btn.attr('data-state') || '',
            id = $btn.attr('data-id'),
            $icon = $btn.find('i');

        if (state === '') {
            new_state = 'selected';
            $btn.attr('class', 'btn btn-warning');
            $btn.attr('data-state', new_state);
            $btn.attr('style', '');
            $icon.attr('class', 'icon-star');
        } else if (state === 'selected') {
            new_state = 'visited';
            $btn.attr('class', 'visited btn btn-primary');
            $btn.attr('data-state', new_state);
            $btn.find('.state-label').text('Visited');
            $btn.attr('style', '');
            $icon.attr('class', 'icon-ok icon-white');
        } else if (state === 'visited') {
            new_state = '';
            $btn.attr('class', 'default btn');
            $btn.attr('data-state', new_state);
            $btn.attr('style', 'color:#ccc;');
            $btn.find('.state-label').text('Favorite');
            $icon.attr('class', 'icon-star icon-white');
        }

        function handleError(e) {
            if (e) console.log(e);
            if (e && e.stack) console.log(e.stack);
            // return to original checked setting if error
            // todo return $input.prop('checked', !checked);
        };

        // merge with existing data
        getMeta(function(resp) {
            var data = {};
            //console.log('getMeta resp', JSON.stringify(resp,null,2));
            if (typeof resp === 'object' && resp.success) {
                data = resp.data[0] || {};
            } else {
                return handleError();
            }
            if (!data[id]) {
                data[id] = {};
            }
            // set and state value for this exhibitor id
            data[id]['state'] = new_state;
            //$select.attr('disabled', 'disabled');
            updateMeta(data, function(resp) {
                //$input.attr('disabled', false);
                if (typeof resp !== 'object' || !resp.success) {
                    return handleError();
                }
                console.log('saved', id, new_state);
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

    function getStateValue(data) {
        return data && data.state;
    }

    function getBtn(state, id) {
        if (state === '') {
            return '<div class="btn-group">'
                + '<a style="color:#ccc;" class="default btn" href="#" data-id="'+id+'" data-state="'+state+'">'
                + '<i class="icon-star icon-white"></i>'
                + ' <span class="state-label">Favorite</span></a>'
                + '</div>';
        } else if (state === 'selected') {
            return '<div class="btn-group">'
                + '<a class="default btn btn-warning" href="#" data-id="'+id+'" data-state="'+state+'">'
                + '<i class="icon-star"></i>'
                + ' <span class="state-label">Favorite</span></a>'
                + '</div>';
        } else if (state === 'visited') {
            return '<div class="btn-group">'
                + '<a class="default btn btn-primary" href="#" data-id="'+id+'" data-state="'+state+'">'
                + '<i class="icon-ok icon-white"></i>'
                + ' <span class="state-label">Visited</span></a>'
                + '</div>';
        }
    }

    function addSelectElementsToListing(el, id, data) {
        //console.log('addSelectedElementsToListing', id, data);
        var val = getStateValue(data) || '';
        var div = $('<div class="field-value" />').append(
            $(getBtn(val, id)).on('click', cycleBtn)
        );
        $(el).find('.field-value').last().after(div);
    }

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

})(jQuery);
