requirejs.config({
    appDir: ".",
    baseUrl: "js",
    paths: {
        /* Load jquery from google cdn. On fail, load local file. */
        'jquery': [/*'//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',*/ 'libs/jquery-2.0.2.min'],
        /* Load bootstrap from cdn. On fail, load local file. */
        'bootstrap': [/*'//netdna.bootstrapcdn.com/twitter-bootstrap/2.2.1/js/bootstrap.min',*/ 'libs/bootstrap-min']
    },
    shim: {
        /* Set bootstrap dependencies (just jQuery) */
        'bootstrap' : ['jquery']
    }
});

require(['jquery', 'bootstrap'], function($) {
    console.log("Loaded :)");
    return {};
});
