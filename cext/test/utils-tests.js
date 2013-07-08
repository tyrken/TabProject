define(["js/utils"], function(utils) {
  describe("utils-tests", function() {

    it("getParameterByName works", function() {
      var url = "http://mystuff?R=e&XX=r%20f&YY=";
      expect(utils.getParameterByName(url, 'R')).toEqual('e');
      expect(utils.getParameterByName(url, 'XX')).toEqual('r f');
      expect(utils.getParameterByName(url, 'YY')).toEqual('');
      expect(utils.getParameterByName(url, 'ZZZ')).toEqual(null);
    });

    it("startsWith works", function() {
      expect(utils.startsWith('myinput', '')).toBe(true);
      expect(utils.startsWith('myinput', 'my')).toBe(true);
      expect(utils.startsWith('myinput', 'myx')).toBe(false);
      expect(utils.startsWith('myinput', null)).toBe(false);
      expect(utils.startsWith('', '')).toBe(true);
      expect(utils.startsWith(null, '')).toBe(false);
    });

    it("setHashParameterByName works", function() {
      var url = "http://mystuff?F=X#y=p%20e&q=123";
      expect(utils.setHashParameterByName("http://mystuff?F=X#y=p%20e&q=123", 'y', 'tt 5')).toEqual('http://mystuff?F=X#y=tt%205&q=123');
      expect(utils.setHashParameterByName("http://mystuff?F=X#x=1&y=p%20e&q=123", 'y', 'tt 5')).toEqual('http://mystuff?F=X#x=1&y=tt%205&q=123');
      expect(utils.setHashParameterByName("http://mystuff?F=X#x=1&y=p%20e", 'y', '4')).toEqual('http://mystuff?F=X#x=1&y=4');
      expect(utils.setHashParameterByName("http://mystuff?y=p", 'y', '4')).toEqual('http://mystuff?y=p#y=4');
      expect(utils.setHashParameterByName("http://mystuff#y=p", 'y', null)).toEqual('http://mystuff#');
      expect(utils.setHashParameterByName("http://mystuff#x=7&y=p", 'y', null)).toEqual('http://mystuff#x=7');
      expect(utils.setHashParameterByName("http://mystuff#y=p&t=2", 'y', null)).toEqual('http://mystuff#t=2');
    });

  });
});