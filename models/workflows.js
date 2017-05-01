var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Workflow = new Schema({
    name: String,
    global: {type: Array},
    rules: {type: Array}
});

module.exports = mongoose.model('Workflow', Workflow);