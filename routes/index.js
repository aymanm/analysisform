var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/', require('./tempform'))

router.get('/newanalysis', function(req, res, next) {
  res.render('newanalysis', { title: 'Express' , user: req.user});
});


router.get('/api/smtptest', function (req, res) {
  var poolConfig = 'smtp://smtp.nyu.edu:25/?pool=true';
  var transporter = nodemailer.createTransport(poolConfig)
  transporter.verify(function(error, success) {
    if (error) {
          res.json({message:error});
    } else {
          res.json({message:'Server is ready to take our messages'});
    }
  });
})

var exec = require('child_process').exec;
var fs = require('fs')
var _ = require('underscore')

router.post('/api/getdeseq', function (req, res) {
  var designData = req.body.samples
  var cond_rep = designData.map(function(sample){
        var name = ''
        if(sample.condition)
            name += sample.condition
        if(sample.timefactor)
            name += sample.timefactor
        
        return {name: name, rep: sample.replicate}
  })

  var grouped = _.groupBy(cond_rep, function(name_rep){ return name_rep.name })
  var conditions = [], lengths = []

  for (var k in grouped){
    if (grouped.hasOwnProperty(k)) {
         conditions.push(k);
         lengths.push(grouped[k].length)
    }
  }

  conditions = conditions.join(',')
  lengths = lengths.join(',')

  var cmd = "cd routes && ./make_deseq2.pl "+conditions+ " " + lengths
  // var cmd = "pwd"
  exec(cmd, function (error, stdout, stderr) {
      fs.readFile('./routes/DESEQ2.R','utf-8', function read(err, data) {
        if (err) {
            throw err;
        }
        exec("rm ./routes/DESEQ2.R", function(error1, stdout1, stderr1){
            
            res.json(data);
        })
        
      });
  })
})

router.post('/api/sendemail', function (req, res) {
    
    var poolConfig = 'smtp://smtp.nyu.edu:25/?pool=true';
    var transporter = nodemailer.createTransport(poolConfig)


    var subject = req.body.formData.ncbid == '' ? 'Samplesheet' : req.body.formData.ncbid
    var to = req.body.formData.netid + '@nyu.edu'
    if(req.body.formData.ncbid != '')
      to += ',' + 'jira.cbi.nyuad@gmail.com'

    var selectedTypes = req.body.formData.analType.map(function(type){
      if(req.body.formData.analTypeSelected[type.id])
        return type.name
      return ''
    })
    
    selectedTypes = selectedTypes.filter(v => v != '')
    selectedTypes = selectedTypes.join(',')

    var emailBody = 'Analysis Information: \n\n'
    emailBody += 'NCS-ID: ' + req.body.formData.ncsid + '\n'
    emailBody += 'NCB-ID: ' + req.body.formData.ncbid + '\n'
    emailBody += 'Analysis Type: ' + selectedTypes + '\n'
    emailBody += 'Notes: ' + req.body.formData.notes + '\n\n'
    // setup email data with unicode symbols
    var mailOptions = {
        from: req.body.formData.netid + '@nyu.edu', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: emailBody, // plain text body
        attachments: [
        {   // utf-8 string as an attachment
            filename: 'samples_renamed.csv',
            content: req.body.renamedCsv
        },
        {   // utf-8 string as an attachment
            filename: 'samples_design.csv',
            content: req.body.designCsv
        }]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.status(400).send({errmsg:error.message});
            return console.log(error);
        }
        res.json({message:'Message '+ info.messageId + ' sent: '+ info.response});
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
  })

module.exports = router;
