define(function() {

  var c = {
    fake_chrome_extension: "abcd",
    fake_bookmarks: {
      1: [{
          id: 2,
          title: "TabProject"
        }
      ],
      2: [{
          id: 3,
          title: "Project1"
        }, {
          id: 4,
          title: "Project2"
        }
      ],
      3: [{
          id: 10,
          parentId: 3,
          title: "Project1",
          url: 'chrome-extension://abcd/project.html?name=Project1'
        }, {
          id: 11,
          parentId: 3,
          title: "Some Page",
          url: 'http://somewhere.com'
        }
      ],
      4: [{
          id: 20,
          parentId: 4,
          title: "Project2",
          url: 'chrome-extension://abcd/project.html?name=Project2#ao=1'
        }, {
          id: 21,
          parentId: 4,
          title: "Some Other Page",
          url: 'http://somewhere.else.com'
        }
      ]
    },

    bookmarks: null,
    i18n: null,
    tabs: null
  };

  c.reset = function() {
    this.i18n = {
      getMessage: function() {
        return c.fake_chrome_extension;
      }
    };
    this.bookmarks = {
      getChildren: function(id, callback) {
        var nodes = c.fake_bookmarks[id];
        // console.log('Getting bookmark #' + id + ' children', nodes);
        callback(nodes);
      },

      create: function(newBookmark) {
        console.log('Creating bookmark', newBookmark);
      }
    };
  };

  c.reset();
  return c;
});