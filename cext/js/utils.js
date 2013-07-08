define(["jquery"], function($) {

  return {

    getParameterByName: function(url, name) {
      var match = new RegExp('[?&#]' + name + '=([^&]*)').exec(url);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },

    startsWith: function(input, prefix) {
      if (input !== '' && !input) return false;
      if (prefix === '') return true;
      if (!prefix) return false;
      return input.slice(0, prefix.length) === prefix;
    },

    setHashParameterByName: function(url, name, value) {
      if (value === null) {
        var re2 = new RegExp('([&#])' + name + '=[^&]*&?');
        var re3 = new RegExp('&$');
        url = url.replace(re2, '$1');
        url = url.replace(re3, '');
      } else {
        var newHashParam = name + '=' + encodeURIComponent(value);
        var re = new RegExp('([&#])' + name + '=[^&]*', 'g');
        var match = re.exec(url);
        if (match) {
          url = url.substring(0, match.index) + match[1] + newHashParam + url.substring(re.lastIndex);
        } else {
          url = url + (url.indexOf('#') > 0 ? '&' : '#') + newHashParam;
        }
      }
      return url;
    },

  };
});