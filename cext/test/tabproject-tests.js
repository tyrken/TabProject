define(['utils', 'ichrome', 'tabproject'], function(utils, ichrome, tp) {
  describe("tabproject-tests", function() {

    it("Minor projectUrl functions work", function() {
      var projectUrl = tp.getProjectPageUrl('fred');
      expect(projectUrl).toBe('chrome-extension://abcd/project.html?name=fred');
      expect(tp.isProjectPageUrl(projectUrl)).toBe(true);
      expect(tp.isProjectPageUrl('f'+projectUrl)).toBe(false);
    });

    it("Can list projects from bookmarks DB", function() {
      ichrome.reset();

      tp.listDBProjects(function(projects) {
        console.log('Got projects', projects);
        expect(projects.length).toBe(2);
        expect(projects[0].name).toBe("Project1");
        expect(projects[0].autosave).toBe(false);
        expect(projects[0].autoopen).toBe(false);
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
        expect(project).toBe(null);
      });
    });

  });
});