/**
 * Listen for log events on the cluster and write them to the grunt log
 * @type {[type]}
 */
module.exports = logClusterLogs;

var grunt = require('grunt');
var clc = require('cli-color');
var CliTable = require('cli-table');
var _ = require('lodash');

// mapping for log levels to grunt log methods
var writes = {
  INFO: grunt.verbose.writeln,
  DEBUG: grunt.log.debug,
  WARN: grunt.log.writeln,
  default: grunt.log.writeln,
  ERROR: grunt.log.error,
  FATAL: grunt.fail.warn
};

var colors = {
  INFO: clc.green,
  DEBUG: clc.cyan,
  default: function (txt) { return clc.reset + txt; },
  WARN: clc.yellow,
  FATAL: clc.magentaBright,
  ERROR: clc.white.bgRed
};

function logClusterLogs(cluster) {
  cluster.on('log', function(log) {
    // ignore progress events for now
    if (log.type === 'progress') return;

    if (typeof log === 'string') {
      write(log);
      return;
    }

    var write = writes[log.level] || writes.default;
    var color = colors[log.level] || colors.default;
    var msg = [
      log.level || '',
      log.node || '',
      log.type || '',
      log.message || ''
    ];

    write(msg.join(' - '));
  });
}
