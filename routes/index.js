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

router.post('/api/sendemail', function (req, res) {
    
    var test = req.body
    var poolConfig = 'smtp://smtp.nyu.edu:25/?pool=true';
    var transporter = nodemailer.createTransport(poolConfig)


    var subject = req.body.formData.ncbid == '' ? 'Samplesheet' : req.body.formData.ncbid
    // setup email data with unicode symbols
    var mailOptions = {
        from: '"ayman yousif" <ay21@nyu.edu>', // sender address
        to: req.body.formData.netid + '@nyu.edu', // list of receivers
        subject: subject, // Subject line
        text: 'Hello world ?', // plain text body
        attachments: [
        {   // utf-8 string as an attachment
            filename: 'samplesheet_edited.csv',
            content: req.body.csvContent
        }]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.json(error);
            return console.log(error);
        }
        res.json({message:'Message '+ info.messageId + ' sent: '+ info.response});
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
  })

module.exports = router;
