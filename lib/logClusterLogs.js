/**
 * Listen for log events on the cluster and write them to the grunt log
 * @type {[type]}
 */
module.exports = logClusterLogs;

var grunt = require('grunt');
var clc = require('cli-color');
var CliTable = require('cli-table');
var _ = require('lodash');

// mappings for log levels to grunt log methods
var writes = {
  default: grunt.log.writeln,
  3: grunt.log.error,
  4: grunt.fail.warn
};

var colors = {
  default: function (text) { return clc.reset + text; },
  0: clc.cyan,
  1: clc.green,
  2: clc.yellow,
  3: clc.white.bgRed,
  4: clc.magentaBright
};

function logScore (level) {
  var logScores = {
    debug: 0,
    default: 1,
    info: 1,
    warn: 2,
    warning: 2,
    error: 3,
    fatal: 4
  };
  var logLevel = level && level.toLowerCase() || 'default';
  return logScores[logLevel];
}

function logClusterLogs(cluster, configuredLevel, quiet) {
  if (quiet) {
    return noop;
  }
  cluster.on('log', onClusterLog);
  return flush;
  function onClusterLog(log) {
    if (log.type === 'progress') { // ignore progress events for now
      return;
    }
    if (typeof log === 'string') {
      flush('default', log);
      return;
    }
    var msg = [
      log.node || 'master',
      log.type || '',
      log.message || ''
    ];
    flush(log.level, msg.join(' - '));
  }
  function flush(level, message) {
    var logLevel = logScore(level);
    if (logLevel < logScore(configuredLevel)) {
      return;
    }
    var writer = writes[logLevel] || writes.default;
    var color = colors[logLevel] || colors.default;
    var prefix = clc.white.bgBlue('[esvm]');
    var levelText = color(level ? ' ' + level.toUpperCase() : '');
    writer(prefix + levelText + ' - ' + message);
  }
}

function noop() {}
