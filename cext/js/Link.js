define(function() {
    "use strict";

    function Link() {
        if (!(this instanceof Link)) {
            throw new TypeError("Link constructor cannot be called as a function.");
        }
        this.title = null;
        this.url = null;
        this.favIconUrl = null;
        this.tabId = 0;
        this.tabIndex = 0;
        this.tabWindowId = 0;
        this.bookmarkId = 0;
        this.bookmarkIndex = 0;
        this.bookmarkParentId = 0;
        this.bookmarked = false;
        this.active = false;
    }

    function bestOf(a, b) {
        if (a) {
            return a;
        }
        return b;
    }

    Link.prototype = {
        constructor : Link,

        setFromBookmark: function(bookmark) {
            this.title = bestOf(this.title, bookmark.title);
            this.url = bestOf(this.url, bookmark.url);
            this.favIconUrl = bestOf(this.favIconUrl, bookmark.favIconUrl);
            this.bookmarkId = bookmark.id;
            this.bookmarkIndex = bookmark.index;
            this.bookmarkParentId = bookmark.parentId;
            this.bookmarked = true;
        },
        setFromTab: function(tab) {
            this.title = bestOf(tab.title, this.title);
            this.url = bestOf(tab.url, this.url);
            this.favIconUrl = bestOf(tab.favIconUrl, this.favIconUrl);
            this.tabId = tab.id;
            this.tabIndex = tab.index;
            this.tabWindowId = tab.windowId;
            this.active = true;
        }
    };

    return Link;
});
