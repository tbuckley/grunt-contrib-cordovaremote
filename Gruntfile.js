module.exports = function(grunt) {
  // Configure project
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    remotecordova: {
      default: {
        src: "/Users/tbuckley/Projects/route-controller",
        dest: "foo",
      },
    },
  });

  // Load custom tasks
  grunt.loadTasks("tasks");
};
