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
  var table;
  var spacer = '   ';
  var colWidths = [5, 0, 15, 0];

  if (process.stdout.isTTY) {
    table = new CliTable({
      chars: {
        'top': '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        'bottom': '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        'left': '',
        'left-mid': '',
        'mid': '',
        'mid-mid': '',
        'right': '',
        'right-mid': '',
        'middle': spacer
      },
      style: {
        'padding-left': 0,
        'padding-right': 0
      },
      colWidths: colWidths
    });
  }

  cluster.on('log', function(log) {
    // ignore progress events for now
    if (log.type === 'progress') return;

    var write = writes[log.level] || writes.default;
    var color = colors[log.level] || colors.default;
    var msg = [
      log.level || '',
      log.node || '',
      log.type || '',
      log.message || ''
    ];

    if (!table) {
      write(msg.join(' - '));
      return;
    }


    var width = 0;
    msg.forEach(function (text, i, list) {
      colWidths[i] = Math.max(text.length, colWidths[i]);
      width += colWidths[i];
      if (i < list.length - 1) {
        width += spacer.length;
      }
    });

    if (width > process.stdout.columns) {
      // resize the last column to fit
      var lastI = colWidths.length - 1;
      var last = colWidths[lastI];
      colWidths[lastI] = process.stdout.columns - (width - last);
    }

    // apply the color to the type
    msg[0] = color(msg[0]);
    table.push(msg);
    write(table.toString());
    table.pop();
  });
}
