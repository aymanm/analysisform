var express = require('express');
var router = express.Router();
var path = require('path');
var yaml = require('yamljs')

function getRootPath()
{
  return path.join(__dirname, '../public');
}

router.get('/tempbuilder', function (req, res) {
        res.sendFile('formTempl.html', { root: getRootPath()}); // load the single view file (angular will handle the page changes on the front-end)
});

var fs = require('fs');
router.get('/api/templ', function (req, res) {

        var obj = JSON.parse(fs.readFileSync(path.join(__dirname, 'templ.json'), 'utf8'));
        res.json(obj);
})

router.get('/api/yaml2json', function (req, res) {
        var obj = yaml.parse(fs.readFileSync(path.join(__dirname, req.query.templname + '.yml'), 'utf8'));
        res.json(obj);
})

var multer = require('multer');
var upload = multer();
router.post('/uploadfromfile', upload.single('yamlfile'), function (req, res) {
        
        var buffer = req.file.buffer;
        var yamlcontent = buffer.toString('ascii')
        var jsonfromyaml = yaml.parse(yamlcontent);
        jsonfromyaml.name = req.file.originalname;
        console.log(jsonfromyaml)
        var workflow = new Workflow(jsonfromyaml);
        workflow.save(function(err){
                res.redirect("templates");
        })
        return;
        
});

router.post('/uploadneditfile', upload.single('yamlfile'), function (req, res) {
        
        var buffer = req.file.buffer;
        var yamlcontent = buffer.toString('ascii')
        var jsonfromyaml = yaml.parse(yamlcontent);
        jsonfromyaml.name = req.file.originalname;
        //console.log(jsonfromyaml)
        //var workflow = new Workflow(jsonfromyaml);
        res.render("templeditor", { templjson: JSON.stringify(jsonfromyaml) });

        //return;
        
});


var Workflow = require('../models/workflows');
router.get('/api/workflow', function (req, res) {
        
        Workflow.findOne({"_id":req.query.templid} ,function(err, workflow){
                res.json(workflow);
        })
});

module.exports = router;
