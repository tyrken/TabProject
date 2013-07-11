define(["utils"], function(utils) {
  describe("utils-tests", function() {

    it("getParameterByName works", function() {
      var url = "http://mystuff?R=e&XX=r%20f&YY=#f=3&i=5";
      expect(utils.getParameterByName(url, 'R')).toEqual('e');
      expect(utils.getParameterByName(url, 'XX')).toEqual('r f');
      expect(utils.getParameterByName(url, 'YY')).toEqual('');
      expect(utils.getParameterByName(url, 'ZZZ')).toEqual(null);
      expect(utils.getParameterByName(url, 'f')).toEqual('3');
      expect(utils.getParameterByName(url, 'i')).toEqual('5');
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
      expect(utils.setHashParameterByName("http://mystuff?F=X#y=p%20e&q=123", 'y', 'tt 5')).toEqual('http://mystuff?F=X#y=tt%205&q=123');
      expect(utils.setHashParameterByName("http://mystuff?F=X#x=1&y=p%20e&q=123", 'y', 'tt 5')).toEqual('http://mystuff?F=X#x=1&y=tt%205&q=123');
      expect(utils.setHashParameterByName("http://mystuff?F=X#x=1&y=p%20e", 'y', '4')).toEqual('http://mystuff?F=X#x=1&y=4');
      expect(utils.setHashParameterByName("http://mystuff?y=p", 'y', '4')).toEqual('http://mystuff?y=p#y=4');
      expect(utils.setHashParameterByName("http://mystuff#y=p", 'y', null)).toEqual('http://mystuff#');
      expect(utils.setHashParameterByName("http://mystuff#x=7&y=p", 'y', null)).toEqual('http://mystuff#x=7');
      expect(utils.setHashParameterByName("http://mystuff#y=p&t=2", 'y', null)).toEqual('http://mystuff#t=2');
    });

    it("isBlank works", function() {
      expect(utils.isBlank('fds')).toBe(false);
      expect(utils.isBlank('')).toBe(true);
      expect(utils.isBlank(null)).toBe(true);
    });

    it("findObject works", function() {
      var objs = ['s', 'd', 'v'];
      expect(utils.findObject(objs, function(s) {
        return s === 'fds';
      })).toBe(null);
      expect(utils.findObject(objs, function(s) {
        return s === 's';
      })).toEqual('s');
    });

    it("String/Array prototypes are extended", function() {
      var objs = ['s', 'd', 'v'];
      expect(objs.findObject(function(s) {
        return s === 'v';
      })).toEqual('v');
      var objs2 = objs.clone();
      objs2.push('x');
      expect(objs.length).toBe(3);
      expect(objs2.length).toBe(4);
      expect('fds'.isBlank()).toBe(false);
      expect('myinput'.startsWith('my')).toBe(true);
    });

    it("CountDownLatch works", function() {
      var cdl, result = 0;

      runs(function(){
        cdl = new utils.CountDownLatch(2, function(){
          ++result;
        });
        cdl.reserve(2);
        cdl.tick();
        cdl.tick();
        cdl.tick();
        cdl.tick();
      });

      waitsFor(function(){
        return result > 0;
      }, 'Should trigger after 4 ticks', 500);

      runs(function(){
        expect(cdl.count).toBe(0);
        expect(result).toBe(1);
      });
    });
  });
});