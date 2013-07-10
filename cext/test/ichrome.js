define(function() {

  var c = {
    fake_chrome_extension: 'abcd',
    fake_bookmarks: {
      1: [{
          id: 2,
          title: 'TabProject'
        }
      ],
      2: [{
          id: 3,
          title: 'Project1'
        }, {
          id: 4,
          title: 'Project2'
        }
      ],
      3: [{
          id: 10,
          parentId: 3,
          title: 'Project1',
          url: 'chrome-extension://abcd/project.html?name=Project1'
        }, {
          id: 11,
          parentId: 3,
          title: 'Some Page',
          url: 'http://somewhere.com'
        }, {
          id: 12,
          parentId: 3,
          title: 'Some Page#2',
          url: 'http://somewhere.com/2'
        }
      ],
      4: [{
          id: 20,
          parentId: 4,
          title: 'Project2',
          url: 'chrome-extension://abcd/project.html?name=Project2#ao=1'
        }, {
          id: 21,
          parentId: 4,
          title: 'Some Other Page',
          url: 'http://somewhere.else.com'
        }
      ]
    },
    fake_tabs: [{
        index: 0,
        title: 'Blah tab',
        url: 'http://gfjklsdf.com'
      }, {
        index: 1,
        title: 'Project 1',
        url: 'chrome-extension://abcd/project.html?name=Project1'
      }, {
        index: 2,
        title: 'Some Page',
        url: 'http://somewhere.com'
      }, {
        index: 3,
        title: 'New Page',
        url: 'http://unsaved.com'
      }, {
        index: 0,
        title: 'Project 51',
        url: 'chrome-extension://abcd/project.html?name=Project51#as=1'
      }, {
        index: 1,
        title: 'Funnyville',
        url: 'http://funny.com'
      }
    ],

    bookmarks: {
      nextId: 100,
      added: [],
      getChildren: function(parentId, callback) {
        var nodes = [];
        if (c.fake_bookmarks[parentId]) {
          nodes = c.fake_bookmarks[parentId].clone();
        }
        this.added.forEach(function(newBookmark) {
          if (newBookmark.parentId === parentId) {
            nodes.push(newBookmark);
          }
        });
        callback(nodes);
      },
      create: function(newBookmark, callback) {
        newBookmark.id = ++(this.nextId);
        console.log('Creating bookmark', newBookmark);
        this.added.push(newBookmark);
        callback(newBookmark);
      }
    },
    i18n: {
      getMessage: function() {
        return c.fake_chrome_extension;
      }
    },
    tabs: {
      added: [],
      query: function(queryObj, callback) {
        callback(c.fake_tabs);
      },
      create: function(newTab) {
        console.log('Creating tab', newTab);
        this.added.push(newTab);
      }
    },

    reset: function() {
      this.bookmarks.added.length = 0;
      this.tabs.added.length = 0;
      this.bookmarks.nextId = 100;
    }
  };

  return c;
});