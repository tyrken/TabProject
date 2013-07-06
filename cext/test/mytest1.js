define(["test/mytest1"], function (notepad) {
    describe("returns titles", function () {

// From http://stackoverflow.com/questions/16423156/getting-requirejs-to-work-with-jasmine
        it("something", function() {

            expect(notepad.noteTitles()).toEqual("pick up the kids get milk");
        });

    });
});
