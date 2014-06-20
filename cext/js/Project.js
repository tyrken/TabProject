define(['js/Link', 'js/utils', 'ichrome'], function(Link, utils, ichrome) {
    "use strict";

    function Project(name) {
        if (!(this instanceof Project)) {
            throw new TypeError("Project constructor cannot be called as a function.");
        }
        this.name = name;
        this.url = null;
        this.tabId = 0;
        this.tabIndex = 0;
        this.tabWindowId = 0;
        this.bookmarkParentId = 0;
        this.bookmarkId = 0;
        this.bookmarkIndex = 0;
        this.autosave = false;
        this.autoopen = false;
        this.links = [];
    }

    function bestOf(a, b) {
        if (a) {
            return a;
        }
        return b;
    }

    Project.StopPageUrl = 'chrome-extension://' + ichrome.i18n.getMessage("@@extension_id") + '/stop.html';
    var ProjectPageBase = 'chrome-extension://' + ichrome.i18n.getMessage("@@extension_id") + '/project.html?name=';

    Project.getProjectPageUrl = function(name) {
        return ProjectPageBase + encodeURIComponent(name);
    };

    Project.isProjectPageUrl = function(url) {
        return utils.startsWith(url, ProjectPageBase);
    };

    Project.normaliseUrl = function(url) {
        if (Project.isProjectPageUrl(url)) {
            return false;
        }
        if (utils.startsWith(url, 'chrome-extension://') && utils.contains('/project.html?name=')) {

        }
    };

    function parseUrl(proj) {
        proj.autosave = !! utils.getParameterByName(proj.url, 'as');
        proj.autoopen = !! utils.getParameterByName(proj.url, 'ao');
        proj.name = utils.getParameterByName(proj.url, 'name');
    }

    Project.prototype = {
        constructor : Project,

        setFromFolderBookmark: function(folder) {
            this.name = bestOf(this.name, folder.title);
            this.url = bestOf(this.url, Project.getProjectPageUrl(folder.title));
            this.bookmarkParentId = folder.id;
        },
        setFromBookmark: function(bookmark) {
            this.name = bestOf(this.name, bookmark.title);
            this.url = bestOf(bookmark.url, this.url);
            this.bookmarkId = bookmark.id;
            this.bookmarkIndex = bookmark.index;
            this.bookmarkParentId = bookmark.parentId;
            parseUrl(this);
        },
        setFromTab: function(tab) {
            this.name = bestOf(utils.getParameterByName(tab.url, 'name'), this.name);
            this.url = bestOf(tab.url, this.url);
            this.favIconUrl = bestOf(tab.favIconUrl, this.favIconUrl);
            this.tabId = tab.id;
            this.tabIndex = tab.index;
            this.tabWindowId = tab.windowId;
            this.active = true;
            parseUrl(this);
        }
    };

    return Project;
});
