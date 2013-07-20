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
        expect(projects[0].links.length).toBe(2);
        expect(projects[0].links[0].title).toBe('Some Page');
        expect(projects[0].links[1].url).toBe('http://unsaved.com');
        expect(projects[1].name).toBe("Project51");
        expect(projects[1].autosave).toBe(true);
        expect(projects[1].autoopen).toBe(false);
        expect(projects[1].links.length).toBe(1);
        expect(projects[1].links[0].title).toBe('Funnyville');
      });
    });

    /*it("Can merge a single project's info from tabs and bookmarks", function() {
      ichrome.reset();

      tp.lookupProjectContent('Project1', function(project) {
        console.log('Got project', project);
        expect(project.name).toBe('Project1');
        expect(project.url).toBe('chrome-extension://abcd/project.html?name=Project1');
        expect(project.autosave).toBe(false);
        expect(project.autoopen).toBe(false);
        expect(project.links.length).toBe(3);
        expect(project.links[0].title).toBe('Some Page');
        expect(project.links[0].active).toBe(true);
        expect(project.links[0].bookmarked).toBe(true);
        expect(project.links[1].url).toBe('http://unsaved.com');
        expect(project.links[1].active).toBe(true);
        expect(project.links[1].bookmarked).toBe(false);
        expect(project.links[2].title).toBe('Some Page#2');
        expect(project.links[2].active).toBe(false);
        expect(project.links[2].bookmarked).toBe(true);
      });
    }); */

    it("Can merge all projects from tabs and bookmarks", function() {
      ichrome.reset();

      tp.getProjectsFromDBAndTabs(function(projects) {
        console.log('Got projects', projects);
        expect(projects.length).toBe(4);

        expect(projects[0].name).toBe("(Unallocated)");
        expect(projects[0].autosave).toBe(false);
        expect(projects[0].autoopen).toBe(false);
        expect(projects[0].links.length).toBe(2);
        expect(projects[0].links[0].title).toBe('Blah tab');
        expect(projects[0].links[0].url).toBe('http://gfjklsdf.com');
        expect(projects[0].links[1].title).toBe('Misc page');
        expect(projects[0].links[1].url).toBe('http://funnyxx.com');

        expect(projects[1].name).toBe("Project1");
        expect(projects[1].autosave).toBe(false);
        expect(projects[1].autoopen).toBe(false);
        expect(projects[1].links.length).toBe(3);
        expect(projects[1].links[0].title).toBe('Some Page');
        expect(projects[1].links[1].url).toBe('http://somewhere.com/2');
        expect(projects[1].links[2].url).toBe('http://unsaved.com');
        expect(projects[2].name).toBe("Project2");
        expect(projects[2].autosave).toBe(false);
        expect(projects[2].autoopen).toBe(true);
        expect(projects[2].links.length).toBe(1);
        expect(projects[2].links[0].title).toBe('Some Other Page');
        expect(projects[3].name).toBe("Project51");
        expect(projects[3].autosave).toBe(true);
        expect(projects[3].autoopen).toBe(false);
        expect(projects[3].links.length).toBe(1);
        expect(projects[3].links[0].title).toBe('Funnyville');
/*
        expect(project.name).toBe('Project1');
        expect(project.url).toBe('chrome-extension://abcd/project.html?name=Project1');
        expect(project.autosave).toBe(false);
        expect(project.autoopen).toBe(false);
        expect(project.links.length).toBe(3);
        expect(project.links[0].title).toBe('Some Page');
        expect(project.links[0].active).toBe(true);
        expect(project.links[0].bookmarked).toBe(true);
        expect(project.links[1].url).toBe('http://unsaved.com');
        expect(project.links[1].active).toBe(true);
        expect(project.links[1].bookmarked).toBe(false);
        expect(project.links[2].title).toBe('Some Page#2');
        expect(project.links[2].active).toBe(false);
        expect(project.links[2].bookmarked).toBe(true); */
      });
    });

    it("Global bookmark update works", function() {
      var result = 0;

      runs(function() {
        ichrome.reset();
        tp.makeAllBookmarks(function() {
          ++result;
        });
      });

      waitsFor(function() {
        return result > 0;
      }, 2000, 'all adding');

      runs(function() {
        expect(result).toBe(1);
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