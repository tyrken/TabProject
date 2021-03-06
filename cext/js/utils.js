define(["jquery"], function($) {

    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#47;'
    };

    var u = {

        getParameterByName: function(url, name) {
            var match = new RegExp('[?&#]' + name + '=([^&#]*)').exec(url);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        },

        setHashParameterByName: function(url, name, value) {
            if (value === null) {
                var re2 = new RegExp('([&#])' + name + '=[^&]*&?');
                var re3 = new RegExp('[&#]$');
                url = url.replace(re2, '$1');
                url = url.replace(re3, '');
            } else {
                var newHashParam = name + '=' + encodeURIComponent(value);
                var re = new RegExp('([&#])' + name + '=[^&]*', 'g');
                var match = re.exec(url);
                if (match) {
                    url = url.substring(0, match.index) + match[1] + newHashParam + url.substring(re.lastIndex);
                } else {
                    if (!/[#&]$/.test(url)) {
                        if (url.indexOf('#') > 0) {
                            url = url + '&';
                        } else {
                            url = url + '#';
                        }
                    }
                    url = url + newHashParam;
                }
            }
            return url;
        },

        escapeForHtml: function(string) {
            return String(string).replace(/[&<>"'\/]/g, function(s) {
                return entityMap[s];
            });
        },

        isBlank: function(str) {
            return (!str || /^\s*$/.test(str));
        },

        startsWith: function(input, prefix) {
            if (input !== '' && !input) return false;
            if (prefix === '') return true;
            if (!prefix) return false;
            return input.slice(0, prefix.length) === prefix;
        },

        findObject: function(array, predicate) {
            for (var i = 0, j = array.length; i < j; ++i) {
                if (predicate(array[i])) {
                    return array[i];
                }
            }
            return null;
        },

        DummyCountDownLatch: {
            tick: function() {},
            reserve: function(extra) {}
        },
        CountDownLatch: function(count, callback) {
            if (count < 0) {
                throw "countDownLatch counter must not be negative";
            }
            if (!callback) {
                return u.DummyCountDownLatch;
            }
            this.count = count;
            this.callback = callback;
            if (count === 0) {
                callback();
            }
            return this;
        }
    };

    u.CountDownLatch.prototype.tick = function() {
        if (--this.count === 0) {
            this.callback();
        }
    };
    u.CountDownLatch.prototype.reserve = function(extra) {
        this.count += extra;
    };

    if (!Array.prototype.findObject) {
        Array.prototype.findObject = function(predicate) {
            return u.findObject(this, predicate);
        };
    }
    if (!Array.prototype.clone) {
        Array.prototype.clone = function() {
            return this.slice(0);
        };
    }
    if (!String.prototype.isBlank) {
        String.prototype.isBlank = function() {
            return u.isBlank(this);
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(prefix) {
            return u.startsWith(this, prefix);
        };
    }
    if (!String.prototype.escapeForHtml) {
        String.prototype.escapeForHtml = function() {
            return u.escapeForHtml(this);
        };
    }

    return u;
});