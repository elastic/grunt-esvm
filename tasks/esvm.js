/*
 * grunt-esvm
 * https://github.com/spenceralger/grunt-esvm
 *
 * Copyright (c) 2014 Spencer Alger
 * Licensed under the Apache, 2.0 licenses.
 */

var libesvm = require('libesvm');
var _ = require('lodash');
var logClusterLogs = require('../lib/logClusterLogs');
var Table = require('cli-table');

module.exports = function (grunt) {

  var activeClusters = {};

  function shutdown(name, done) {
    var cluster = activeClusters[name];

    if (!cluster)
      grunt.fail.warn('Unable to shutdown unknown cluster "' + name + '"');

    return cluster.shutdown()
    .finally(function () {
      delete activeClusters[name];
    })
    .nodeify(done);
  }

  process.on('exit', function () {
    _.forOwn(activeClusters, function (cluster) {
      cluster.shutdown();
    });
  });

  grunt.registerMultiTask('esvm', 'Create elasticsearch clusters from grunt.', function (keepalive) {
    // the config name, "esvm:<target>"
    var name = this.target;
    var flags = _(grunt.option('esvm-flags'))
    .tap(function (s) { return _.isString(s) ? s.split(',') : []; })
    .map(function (f) { return f.trim(); })
    .filter(Boolean)
    .value();

    var options = this.options({
      quiet: false,
      fresh: _.contains(flags, 'fresh'),
      purge: _.contains(flags, 'purge')
    });

    process.exit();

    if (activeClusters[name]) {
      grunt.fail.warn('There is already a "' + name + '" cluster running.');
    }

    var quiet = grunt.option('verbose') ? false : options.quiet;
    delete options.quiet;

    var cluster = activeClusters[name] = libesvm.createCluster(options);

    if (!quiet) {
      logClusterLogs(cluster);
    }

    grunt.log.writeln('starting up "' + name + '" cluster');
    var startup = cluster.install()
    .then(function () {
      return cluster.installPlugins();
    })
    .then(function () {
      return cluster.start();
    })
    .then(function (nodes) {
      grunt.log.ok('Started ' + nodes.length + ' Elasticsearch nodes.');

      var table = new Table({
        head: ['port', 'node name']
      });

      nodes.forEach(function (node) {
        table.push([
          node.port,
          node.name
        ]);
      });

      grunt.log.writeln(table.toString());
    });


    if (keepalive === 'keepalive') {
      grunt.log.writeln('Keeping elasticsearch alive, to shutdown press command/control+c');
      process.on('SIGINT', _.partial(shutdown, name, this.async()));
    } else {
      startup.nodeify(this.async());
    }
  });

  grunt.registerTask('esvm_shutdown', function (name) {
    shutdown(name, this.async());
  });

};
