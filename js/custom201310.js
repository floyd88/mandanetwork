(function(jQuery) {

    var PATH = '/13thacg/wp-admin/admin-ajax.php',
        cache = {},
        $ = jQuery;

    function setCache(key, data) {
        console.log('setCache', key, data);
        cache[key] = data;
    };

    function getPosts(ids, callback) {
        var url = PATH + '?action=get_mandanetwork_exhibitors';
        url += '&post_ids=' + ids.join(',');
        $.ajaxQueue({
            type: 'GET',
            url: url,
            error: callback
        }).done(function(resp, txtStatus, xhr) {
            callback(null, resp);
        });
    };

    function getMeta(callback) {
        if (cache.user_meta) {
            return callback(null, $.extend({}, cache.user_meta));
        }
        $.ajaxQueue({
            type: 'GET',
            dataType : 'json',
            url: PATH + '?action=get_mandanetwork_user_meta',
            error: callback
        }).done(function(data, txtStatus, xhr) {
            // cache user meta on first call so subsequent updates are
            // faster
            console.log('getMeta done', data);
            setCache('user_meta', data);
            callback(null, data);
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
            }),
            error: callback
        }).done(function(resp) {
            console.log('updateMeta done', resp);
            setCache('user_meta', {success:true, data:[data]});
            callback(null, resp);
        });
    };

    function cycleBtn(ev) {
        ev.preventDefault();
        var $btn = $(this).find('.btn'),
            orig_state = $btn.attr('data-state') || '',
            id = $btn.attr('data-id'),
            $icon = $btn.find('i');

        if (orig_state === '') {
            new_state = 'selected';
            $btn.attr('class', 'selected btn btn-warning');
            $btn.attr('data-state', new_state);
            $icon.attr('class', 'icon-star');
        } else if (orig_state === 'selected') {
            new_state = 'visited';
            $btn.attr('class', 'visited btn btn-primary');
            $btn.attr('data-state', new_state);
            $btn.find('.state-label').text('Visited');
            $icon.attr('class', 'icon-ok icon-white');
        } else if (orig_state === 'visited') {
            new_state = '';
            $btn.attr('class', 'default btn');
            $btn.attr('data-state', new_state);
            $btn.find('.state-label').text('Favorite');
            $icon.attr('class', 'icon-star icon-white');
        }

        function handleError(e) {
            if (e) console.log(e);
            if (e && e.stack) console.log(e.stack);
            // return to original checked setting if error
            if (orig_state === '') {
                $btn.attr('class', 'default btn');
                $btn.attr('data-state', orig_state);
                $btn.find('.state-label').text('Favorite');
                $icon.attr('class', 'icon-star icon-white');
            } else if (orig_state === 'selected') {
                $btn.attr('class', 'selected btn btn-warning');
                $btn.attr('data-state', orig_state);
                $icon.attr('class', 'icon-star');
                $btn.find('.state-label').text('Favorite');
            } else if (orig_state === 'visited') {
                $btn.attr('class', 'visited btn btn-primary');
                $btn.attr('data-state', orig_state);
                $btn.find('.state-label').text('Visited');
                $icon.attr('class', 'icon-ok icon-white');
            }
            alert('request failed');
        };

        // merge with existing data
        getMeta(function(err, resp) {
            var data = {};
            if (err) {
                return handleError(err);
            }
            data = resp.data[0] || {};
            if (!data[id]) {
                data[id] = {};
            }
            // set state value for this exhibitor id
            data[id]['state'] = new_state;
            updateMeta(data, function(err, xhr) {
                if (err) {
                    return handleError(err);
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
                + '<a class="default btn" href="#" data-id="'+id+'" data-state="'+state+'">'
                + '<i class="icon-star icon-white"></i>'
                + ' <span class="state-label">Favorite</span></a>'
                + '</div>';
        } else if (state === 'selected') {
            return '<div class="btn-group">'
                + '<a class="selected btn btn-warning" href="#" data-id="'+id+'" data-state="'+state+'">'
                + '<i class="icon-star"></i>'
                + ' <span class="state-label">Favorite</span></a>'
                + '</div>';
        } else if (state === 'visited') {
            return '<div class="btn-group">'
                + '<a class="visited btn btn-primary" href="#" data-id="'+id+'" data-state="'+state+'">'
                + '<i class="icon-ok icon-white"></i>'
                + ' <span class="state-label">Visited</span></a>'
                + '</div>';
        }
    }

    function toggleExcerptDetails(ev) {
        ev.preventDefault();
        var $listing = $(this).closest('.wpbdp-listing-excerpt'),
            $toggleLink = $listing.find('.wpbdp-field-company.title .toggle a');
            label = $toggleLink.text();
        $listing.toggleClass('listing-excerpt-expanded');
        if (label === 'Hide') {
            $toggleLink.text('');
        } else {
            $toggleLink.text('Hide');
        }
    }

    function updateListingElements(el, id, data) {
        //console.log('addSelectedElementsToListing', id, data);
        var val = getStateValue(data) || '',
            $listing = $(el),
            $title = $listing.find('.field-value.wpbdp-field-company.title .value');
        var favDiv = $('<div class="listing-favorite-btn field-value" />').append(
            $(getBtn(val, id)).on('click', cycleBtn)
        );
        var $toggle = $('<span class="toggle"> (<a href="#"></a>)</span>');
        $toggle.find('a').on('click', toggleExcerptDetails);
        $title.find('a').on('click', toggleExcerptDetails);
        $title.after($toggle);
        var $profileLink = $('<a>See full profile</a>').attr(
            'href', $title.find('a').attr('href')
        );
        $listing.find('.listing-thumbnail').last().after(favDiv).after(
            $('<div class="listing-full-profile field-value" />').append(
                $profileLink
            )
        );
    }

    function onClickSelectedListings(ev) {
        var btn = Ladda.create(this);
        btn.start();
        getMeta(function(err, resp) {
            var ids = [];
            if (err) {
                console.log('request failed', err, resp);
                return alert('request failed');
            }
            $.each(resp.data[0], function(key, val) {
                if (isSelected(val)) {
                    ids.push(key);
                }
            });
            getPosts(ids, function(err, resp) {
                if (err) {
                    console.log('request failed', err, resp);
                    alert('request failed');
                }
                $('.wpbdp-view-listings-page .listings').html(resp);
                initExcerpts();
                btn.stop();
            });
        });
    }

    function onClickVisitedListings(ev) {
        var btn = Ladda.create(this);
        btn.start();
        getMeta(function(err, resp) {
            var ids = [];
            if (err) {
                return alert('request failed');
            }
            $.each(resp.data[0], function(key, val) {
                if (isVisited(val)) {
                    ids.push(key);
                }
            });
            getPosts(ids, function(err, resp) {
                if (err) {
                    console.log('request failed', err, resp);
                    alert('request failed');
                }
                $('.wpbdp-view-listings-page .listings').html(resp);
                initExcerpts();
                btn.stop();
            });
        });
    }

    var $selBtn = $(
        '<button id="wpbdp-bar-show-selected-button" class="ladda-button btn" '
        + ' data-style="expand-right" data-spinner-color="#555">'
        + '<span class="ladda-label">Favorites</span></button>'
    ).on('click', onClickSelectedListings).appendTo($('.wpbdp-main-links'));

    var $visBtn = $(
        '<button id="wpbdp-bar-show-visited-button" class="ladda-button btn" '
        + ' data-style="expand-right" data-spinner-color="#555">'
        + '<span class="ladda-label">Visited</span></button>'
    ).on('click', onClickVisitedListings).appendTo($('.wpbdp-main-links'));

    function updateCounts(data) {
        $selBtn.find('.ladda-label').text(
            'Favorites ('+ getSelectedCount(data) + ')'
        );
        $visBtn.find('.ladda-label').text(
            'Visited ('+ getVisitedCount(data) + ')'
        );
    }

    /**
     * Transform text into a URL slug: spaces turned into dashes, remove non
     * alphanumeric.
     *
     * @param string text
     */
    var slugify = function(text) {
        return text.trim().replace(/[^\-a-zA-Z0-9,&\.]+/ig, '-');
    }

    function initExcerpts() {
        // update search submit button label so it's shorter
        $('#wpbdmsearchsubmit').attr('value', 'Search');
        $('form#wpbdmsearchform').show();
        if ($('.wpbdp-listing').length <= 0) {
            /* only run on pages with wpdb-listing */
            return;
        }
        /* turn next/prev links into buttons */
        $('.wpbdp-pagination .next a, .wpbdp-pagination .prev a').addClass('btn');
        getMeta(function(err, resp) {
            if (err) {
                console.log('request failed', err, resp);
                /* ignore error on init because it might be person navigating
                 * off page if loading takes long */
                //return alert('request failed');
                return;
            }
            var data = resp.data[0] || {};
            updateCounts(data);
            $('.wpbdp-listing').each(function(idx, el) {
                var parts = $(el).attr('id').split('-'),
                    id = parts[parts.length-1];
                updateListingElements(el, id, data[id] || {});
            });
        });
    }

    function initPdbLinks() {
        $('.pdb-list tr td:nth-child(3)').each(function(idx, el) {
            var $td = $(el),
                $a = $('<a />'),
                slug = slugify($td.text()).toLowerCase();
            $a.attr('href', "../business-directory/" + slug);
            $a.text($td.text());
            $td.html($a);
        });
    }

    function initExhibitorsTable() {
        $('#tablepress-1 .column-2').each(function(idx, el) {
            var $td = $(this),
                text = $td.text(),
                $link = $('<a/>');
            if ($td.find('a').length > 0) {
                /* if we find a link leave it alone */
                return;
            }
            $link.attr('href', '/business-directory/?action=search&dosrch=1&q='
                + encodeURIComponent(text)
            ).text(text);
            $td.text('');
            $td.append($link);
        });
    }

    $(function() {
        loadLibs();
        initPdbLinks();
        initExcerpts();
        initExhibitorsTable();
        /* add margin if wpadminbar is present */
        if ($('#wpadminbar').length > 0) {
            $('html').attr('style', 'margin-top: 28px !important');
        }
    });

    function loadLibs() {

/*! jQuery Ajax Queue v0.1.2pre | (c) 2013 Corey Frang | Licensed MIT */
(function(e){var r=e({});e.ajaxQueue=function(n){function t(r){u=e.ajax(n),u.done(a.resolve).fail(a.reject).then(r,r)}var u,a=e.Deferred(),i=a.promise();return r.queue(t),i.abort=function(o){if(u)return u.abort(o);var c=r.queue(),f=e.inArray(t,c);return f>-1&&c.splice(f,1),a.rejectWith(n.context||n,[i,o,""]),i},i}})(jQuery);



/*!
 * Copyright (c) 2011-2013 Felix Gnass spin.min.js
 * Licensed under the MIT license
 */
(function(t,e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):t.Spinner=e()})(this,function(){"use strict";function t(t,e){var i,n=document.createElement(t||"div");for(i in e)n[i]=e[i];return n}function e(t){for(var e=1,i=arguments.length;i>e;e++)t.appendChild(arguments[e]);return t}function i(t,e,i,n){var o=["opacity",e,~~(100*t),i,n].join("-"),r=.01+100*(i/n),a=Math.max(1-(1-t)/e*(100-r),t),s=u.substring(0,u.indexOf("Animation")).toLowerCase(),l=s&&"-"+s+"-"||"";return f[o]||(c.insertRule("@"+l+"keyframes "+o+"{"+"0%{opacity:"+a+"}"+r+"%{opacity:"+t+"}"+(r+.01)+"%{opacity:1}"+(r+e)%100+"%{opacity:"+t+"}"+"100%{opacity:"+a+"}"+"}",c.cssRules.length),f[o]=1),o}function n(t,e){var i,n,o=t.style;if(void 0!==o[e])return e;for(e=e.charAt(0).toUpperCase()+e.slice(1),n=0;d.length>n;n++)if(i=d[n]+e,void 0!==o[i])return i}function o(t,e){for(var i in e)t.style[n(t,i)||i]=e[i];return t}function r(t){for(var e=1;arguments.length>e;e++){var i=arguments[e];for(var n in i)void 0===t[n]&&(t[n]=i[n])}return t}function a(t){for(var e={x:t.offsetLeft,y:t.offsetTop};t=t.offsetParent;)e.x+=t.offsetLeft,e.y+=t.offsetTop;return e}function s(t){return this===void 0?new s(t):(this.opts=r(t||{},s.defaults,p),void 0)}function l(){function i(e,i){return t("<"+e+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',i)}c.addRule(".spin-vml","behavior:url(#default#VML)"),s.prototype.lines=function(t,n){function r(){return o(i("group",{coordsize:u+" "+u,coordorigin:-l+" "+-l}),{width:u,height:u})}function a(t,a,s){e(f,e(o(r(),{rotation:360/n.lines*t+"deg",left:~~a}),e(o(i("roundrect",{arcsize:n.corners}),{width:l,height:n.width,left:n.radius,top:-n.width>>1,filter:s}),i("fill",{color:n.color,opacity:n.opacity}),i("stroke",{opacity:0}))))}var s,l=n.length+n.width,u=2*l,d=2*-(n.width+n.length)+"px",f=o(r(),{position:"absolute",top:d,left:d});if(n.shadow)for(s=1;n.lines>=s;s++)a(s,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(s=1;n.lines>=s;s++)a(s);return e(t,f)},s.prototype.opacity=function(t,e,i,n){var o=t.firstChild;n=n.shadow&&n.lines||0,o&&o.childNodes.length>e+n&&(o=o.childNodes[e+n],o=o&&o.firstChild,o=o&&o.firstChild,o&&(o.opacity=i))}}var u,d=["webkit","Moz","ms","O"],f={},c=function(){var i=t("style",{type:"text/css"});return e(document.getElementsByTagName("head")[0],i),i.sheet||i.styleSheet}(),p={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:.25,fps:20,zIndex:2e9,className:"spinner",top:"auto",left:"auto",position:"relative"};s.defaults={},r(s.prototype,{spin:function(e){this.stop();var i,n,r=this,s=r.opts,l=r.el=o(t(0,{className:s.className}),{position:s.position,width:0,zIndex:s.zIndex}),d=s.radius+s.length+s.width;if(e&&(e.insertBefore(l,e.firstChild||null),n=a(e),i=a(l),o(l,{left:("auto"==s.left?n.x-i.x+(e.offsetWidth>>1):parseInt(s.left,10)+d)+"px",top:("auto"==s.top?n.y-i.y+(e.offsetHeight>>1):parseInt(s.top,10)+d)+"px"})),l.setAttribute("role","progressbar"),r.lines(l,r.opts),!u){var f,c=0,p=(s.lines-1)*(1-s.direction)/2,h=s.fps,m=h/s.speed,g=(1-s.opacity)/(m*s.trail/100),v=m/s.lines;(function y(){c++;for(var t=0;s.lines>t;t++)f=Math.max(1-(c+(s.lines-t)*v)%m*g,s.opacity),r.opacity(l,t*s.direction+p,f,s);r.timeout=r.el&&setTimeout(y,~~(1e3/h))})()}return r},stop:function(){var t=this.el;return t&&(clearTimeout(this.timeout),t.parentNode&&t.parentNode.removeChild(t),this.el=void 0),this},lines:function(n,r){function a(e,i){return o(t(),{position:"absolute",width:r.length+r.width+"px",height:r.width+"px",background:e,boxShadow:i,transformOrigin:"left",transform:"rotate("+~~(360/r.lines*l+r.rotate)+"deg) translate("+r.radius+"px"+",0)",borderRadius:(r.corners*r.width>>1)+"px"})}for(var s,l=0,d=(r.lines-1)*(1-r.direction)/2;r.lines>l;l++)s=o(t(),{position:"absolute",top:1+~(r.width/2)+"px",transform:r.hwaccel?"translate3d(0,0,0)":"",opacity:r.opacity,animation:u&&i(r.opacity,r.trail,d+l*r.direction,r.lines)+" "+1/r.speed+"s linear infinite"}),r.shadow&&e(s,o(a("#000","0 0 4px #000"),{top:"2px"})),e(n,e(s,a(r.color,"0 0 1px rgba(0,0,0,.1)")));return n},opacity:function(t,e,i){t.childNodes.length>e&&(t.childNodes[e].style.opacity=i)}});var h=o(t("group"),{behavior:"url(#default#VML)"});return!n(h,"transform")&&h.adj?l():u=n(h,"animation"),s});

/*!
 * Ladda 0.8.0 (2013-09-05, 18:54)
 * http://lab.hakim.se/ladda
 * MIT licensed
 *
 * Copyright (C) 2013 Hakim El Hattab, http://hakim.se
 */
(function(t,e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(["spin"],e):t.Ladda=e(t.Spinner)})(this,function(t){"use strict";function e(t){if(t===void 0)return console.warn("Ladda button target must be defined."),void 0;t.querySelector(".ladda-label")||(t.innerHTML='<span class="ladda-label">'+t.innerHTML+"</span>");var e=i(t),n=document.createElement("span");n.className="ladda-spinner",t.appendChild(n);var r,a={start:function(){return t.setAttribute("disabled",""),t.setAttribute("data-loading",""),clearTimeout(r),e.spin(n),this.setProgress(0),this},startAfter:function(t){return clearTimeout(r),r=setTimeout(function(){a.start()},t),this},stop:function(){return t.removeAttribute("disabled"),t.removeAttribute("data-loading"),clearTimeout(r),r=setTimeout(function(){e.stop()},1e3),this},toggle:function(){return this.isLoading()?this.stop():this.start(),this},setProgress:function(e){e=Math.max(Math.min(e,1),0);var n=t.querySelector(".ladda-progress");0===e&&n&&n.parentNode?n.parentNode.removeChild(n):(n||(n=document.createElement("div"),n.className="ladda-progress",t.appendChild(n)),n.style.width=(e||0)*t.offsetWidth+"px")},enable:function(){return this.stop(),this},disable:function(){return this.stop(),t.setAttribute("disabled",""),this},isLoading:function(){return t.hasAttribute("data-loading")}};return o.push(a),a}function n(t,n){n=n||{};var r=[];"string"==typeof t?r=a(document.querySelectorAll(t)):"object"==typeof t&&"string"==typeof t.nodeName&&(r=[t]);for(var i=0,o=r.length;o>i;i++)(function(){var t=r[i];if("function"==typeof t.addEventListener){var a=e(t),o=-1;t.addEventListener("click",function(){a.startAfter(1),"number"==typeof n.timeout&&(clearTimeout(o),o=setTimeout(a.stop,n.timeout)),"function"==typeof n.callback&&n.callback.apply(null,[a])},!1)}})()}function r(){for(var t=0,e=o.length;e>t;t++)o[t].stop()}function i(e){var n,r=e.offsetHeight;r>32&&(r*=.8),e.hasAttribute("data-spinner-size")&&(r=parseInt(e.getAttribute("data-spinner-size"),10)),e.hasAttribute("data-spinner-color")&&(n=e.getAttribute("data-spinner-color"));var i=12,a=.2*r,o=.6*a,s=7>a?2:3;return new t({color:n||"#fff",lines:i,radius:a,length:o,width:s,zIndex:"auto",top:"auto",left:"auto",className:""})}function a(t){for(var e=[],n=0;t.length>n;n++)e.push(t[n]);return e}var o=[];return{bind:n,create:e,stopAll:r}});
}

})(jQuery);
