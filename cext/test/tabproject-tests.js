define(['utils', 'ichrome', 'tabproject'], function(utils, ichrome, tp) {
  describe("tabproject-tests", function() {

    it("Minor projectUrl functions work", function() {
      var projectUrl = tp.getProjectPageUrl('fred');
      expect(projectUrl).toBe('chrome-extension://abcd/project.html?name=fred');
      expect(tp.isProjectPageUrl(projectUrl)).toBe(true);
      expect(tp.isProjectPageUrl('f' + projectUrl)).toBe(false);
    });

    it("Can list projects from bookmarks DB", function() {
      ichrome.reset();

      tp.listDBProjects(function(projects) {
        expect(projects.length).toBe(2);
        expect(projects[0].name).toBe("Project1");
        expect(projects[0].autosave).toBe(false);
        expect(projects[0].autoopen).toBe(false);
        expect(projects[0].storedBookmarks.length).toBe(2);
        expect(projects[0].storedBookmarks[0].title).toBe('Some Page');
        expect(projects[0].storedBookmarks[1].url).toBe('http://somewhere.com/2');
        expect(projects[1].name).toBe("Project2");
        expect(projects[1].autosave).toBe(false);
        expect(projects[1].autoopen).toBe(true);
      });

      tp.getProjectFromDB('Project2', function(project) {
        expect(project.name).toBe("Project2");
        expect(project.storedBookmarks.length).toBe(1);
        expect(project.storedBookmarks[0].title).toBe("Some Other Page");
      });

      tp.getProjectFromDB('Project Blah', function(project) {
        expect(project).toBeNull();
      });
    });

    it("Can list projects from tabs", function() {
      tp.scanTabsForProjects(function(projects) {
        console.log('Got projects', projects);
        expect(projects.length).toBe(2);
        expect(projects[0].name).toBe("Project1");
        expect(projects[0].autosave).toBe(false);
        expect(projects[0].autoopen).toBe(false);
        expect(projects[0].tabDescs.length).toBe(2);
        expect(projects[0].tabDescs[0].title).toBe('Some Page');
        expect(projects[0].tabDescs[1].url).toBe('http://unsaved.com');
        expect(projects[1].name).toBe("Project51");
        expect(projects[1].autosave).toBe(true);
        expect(projects[1].autoopen).toBe(false);
        expect(projects[1].tabDescs.length).toBe(1);
        expect(projects[1].tabDescs[0].title).toBe('Funnyville');
      });
    });

    it("Can merge a project's info from tabs and bookmarks", function() {
      ichrome.reset();

      tp.lookupProjectContent('Project1', function(project) {
        console.log('Got project', project);
        expect(project.name).toBe('Project1');
        expect(project.url).toBe('chrome-extension://abcd/project.html?name=Project1');
        expect(project.autosave).toBe(false);
        expect(project.autoopen).toBe(false);
        expect(project.tabDescs.length).toBe(3);
        expect(project.tabDescs[0].title).toBe('Some Page');
        expect(project.tabDescs[0].active).toBe(true);
        expect(project.tabDescs[0].bookmarked).toBe(true);
        expect(project.tabDescs[1].url).toBe('http://unsaved.com');
        expect(project.tabDescs[1].active).toBe(true);
        expect(project.tabDescs[1].bookmarked).toBe(false);
        expect(project.tabDescs[2].title).toBe('Some Page#2');
        expect(project.tabDescs[2].active).toBe(false);
        expect(project.tabDescs[2].bookmarked).toBe(true);
      });
    });

    it("Global bookmark update works", function() {
      ichrome.reset();

      runs(function() {
        tp.makeAllBookmarks();
      });

      waitsFor(function() {
        return ichrome.bookmarks.added.length === 4;
      }, 2000, 'all adding');

      runs(function() {
        expect(ichrome.bookmarks.added.length).toBe(4);
        expect(ichrome.bookmarks.added[0].title).toBe('New Page');
        expect(ichrome.bookmarks.added[0].url).toBe('http://unsaved.com');
        expect(ichrome.bookmarks.added[0].id).toBe(101);
        expect(ichrome.bookmarks.added[0].parentId).toBe(3);
        expect(ichrome.bookmarks.added[1].title).toBe('Project51');
        expect(ichrome.bookmarks.added[1].url).toBeUndefined();
        expect(ichrome.bookmarks.added[1].id).toBe(102);
        expect(ichrome.bookmarks.added[2].title).toBe('Project51');
        expect(ichrome.bookmarks.added[2].url).toBe('chrome-extension://abcd/project.html?name=Project51');
        expect(ichrome.bookmarks.added[2].parentId).toBe(102);
        expect(ichrome.bookmarks.added[3].title).toBe('Funnyville');
        expect(ichrome.bookmarks.added[3].url).toBe('http://funny.com');
        expect(ichrome.bookmarks.added[3].parentId).toBe(102);
      });
    });
  });
});