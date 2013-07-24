define(["Link", "ichrome"], function(Link, ichrome) {
    "use strict";

    function Project() {
        if (!(this instanceof Project)) {
            throw new TypeError("Project constructor cannot be called as a function.");
        }
        this.name = null;
        this.url = null;
        this.tabId = 0;
        this.tabIndex = 0;
        this.tabWindowId = 0;
        this.bookmarkParentId = 0;
        this.bookmarkId = 0;
        this.bookmarkIndex = 0;
        this.autosave = false;
        this.autoopen = false;
    }

    function bestOf(a, b) {
        if (a) {
            return a;
        }
        return b;
    }

    var ProjectPageBase = 'chrome-extension://' + ichrome.i18n.getMessage("@@extension_id") + '/project.html?name=';

    function getProjectPageUrl (name) {
        return ProjectPageBase + encodeURIComponent(name);
    }

    Project.isProjectPageUrl = function(url) {
        return utils.startsWith(url, my.ProjectPageBase);
    };


    Project.prototype = {
        constructor : Project,

        setFromFolderBookmark: function(bookmark) {
            this.name = bestOf(this.name, bookmark.title);
            this.url = bestOf(this.url, getProjectPageUrl(bookmark.title));
            this.bookmarkParentId = bookmark.id;
        },
        setFromBookmark: function(bookmark) {
            this.name = bestOf(this.name, bookmark.title);
            this.url = bestOf(this.url, getProjectPageUrl(bookmark.title));
            this.bookmarkId = bookmark.id;
            this.bookmarkIndex = bookmark.index;
            this.bookmarkParentId = bookmark.parentId;
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

    return Project;
});
