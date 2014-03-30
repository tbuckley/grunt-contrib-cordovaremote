
/*
 * grunt-replace
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 outaTiME
 * Licensed under the MIT license.
 * https://github.com/outaTiME/grunt-replace/blob/master/LICENSE-MIT
 */

module.exports = function(grunt) {

  var path = require("path");
  var fs = require("fs");
  var xml2js = require("xml2js");

  grunt.registerMultiTask("remotecordova", "Serve cordova plugin files remotely.", function() {

    // Validate config
    this.files.forEach(function(filePair) {
      if(filePair.src.length > 1) {
        grunt.fail.warn("Cannot merge multiple Cordova projects");
      }
    });

    // Add Cordova files to projects
    this.files.forEach(function(filePair) {
      filePair.src.forEach(function(src) {
        addCordovaFiles(src, filePair.dest);
      });
    });

  });

  var addCordovaFiles = function(src, dest) {
    var pluginsDir = path.join(src, "plugins");
    var pluginConfigs = [];
    grunt.file.recurse(pluginsDir, function(abspath, rootdir, subdir, filename) {
      if(filename === "plugin.xml") {
        pluginConfigs.push(abspath);
      }
    });

    var metadata = {},
        plugindata = [];
    pluginConfigs.forEach(function(configFile) {
      var parser = new xml2js.Parser();
      var data = grunt.file.read(configFile);
      var pluginDir = path.dirname(configFile);

      parser.parseString(data, function(err, result) {
        var plugin = result['plugin'],
            id = plugin['$']['id'],
            version = plugin['$']['version'],
            jsmodule = plugin['js-module'][0],
            moduleSrc = jsmodule['$']['src'],
            moduleName = jsmodule['$']['name'],
            moduleClobbers = jsmodule['clobbers'][0]['$']['target'];

        // Set metadata for plugin
        metadata[id] = version;

        // Add plugindata for plugin
        var moduleAbs = path.join(pluginDir, moduleSrc);
        var moduleRel = path.relative(src, moduleAbs);
        plugindata.push({
          file: moduleRel,
          id: id + "." + moduleName,
          clobbers: [moduleClobbers],
        });

        // Copy plugin files
        var moduleDest = path.join(dest, moduleRel);
        grunt.file.mkdir(path.dirname(moduleDest));
        grunt.file.copy(moduleAbs, moduleDest, {
          process: function (contents) {
            var header = "cordova.define(\"" + id + "." + moduleName + "\", function(require, exports, module) {\n\n";
            var footer = "\n\n});";
            return header + contents + footer;
          }
        });
      });
    });

    // Write cordova_plugins.js
    var pluginsConfig = "cordova.define('cordova/plugin_list', function(require, exports, module) {\n" +
      "module.exports = " + JSON.stringify(plugindata) + ";\n" +
      "module.exports.metadata = " + JSON.stringify(metadata) + ";\n" +
      "});";
    grunt.file.write(path.join(dest, "cordova_plugins.js"), pluginsConfig);

    // Copy cordova.js (ANDROID-ONLY)
    grunt.file.copy(path.join(src, "platforms/android/assets/www/cordova.js"), path.join(dest, "cordova.js"));
  };

};
