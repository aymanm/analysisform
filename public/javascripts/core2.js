// public/core.js
var app = angular.module('templApp', ['ui.sortable','ngMessages','ui.bootstrap','ngSanitize','angular-bind-html-compile','ngLoadingSpinner','ngAnimate']);

app.controller("mainController",function ($scope, $http, $sce, $compile) {
    $scope.min = 1;

    var vm = this;
    vm.infoFormData = {};
    vm.infoFormData.netid = ''
    vm.infoFormData.ncsid = ''
    vm.infoFormData.ncbid = ''
    vm.infoFormData.notes = ''
    // $scope.globalCollapsed = false;

    vm.infoFormData.analTypeSelected = {};
    vm.infoFormData.analType = [
    {
        'name': 'Multifactorial',
        'id': 1
    }, {
        'name': 'Timeseries',
        'id': 2
    }, {
        'name': 'Standard DGE',
        'id': 3
    }];


    vm.newCondition = '';
    vm.conditions = [];

    vm.newSample = '';
    vm.newSampleCondition = '';
    vm.newReplicate = ''
    vm.sampleNames = []
    vm.sampleNamesCurrent = []
    vm.samplesOutput = []

    vm.lanes = [false,false,false,false,false,false,false,false]
    vm.allLanesSelected = false;

    //Model
    vm.currentStep = 1;
    vm.steps = [
        {
        step: 1,
        name: "Fill Analysis Information",
        template: "step1info.html"
        },
        {
        step: 2,
        name: "Add Conditions",
        template: "step2conditions.html"
        },   
        {
        step: 3,
        name: "Import Sample Sheet CSV",
        template: "step3importsamplescsv.html"
        },
        {
        step: 4,
        name: "Add Samples",
        template: "step4samples.html"
        },
        {
        step: 5,
        name: "Finish",
        template: "step5finish.html"
        },           
    ];

    //Functions
    vm.gotoStep = function(newStep) {
        vm.currentStep = newStep;
    }
    
    vm.getStepTemplate = function(){
        for (var i = 0; i < vm.steps.length; i++) {
            if (vm.currentStep == vm.steps[i].step) {
                return vm.steps[i].template;
            }
        }
    }

    $scope.$watch('vm.lanes', function () {
        vm.allLanesSelected = vm.lanes.reduce(function(laneX,laneY){
            return laneX && laneY
        })
    }, true);
    $scope.selectAllLanesToggle = function(){
        for(var i = 0; i < vm.lanes.length; i++)
            vm.lanes[i] = vm.allLanesSelected
    }
    
    vm.someSelected = function (object) {
        return Object.keys(object).some(function (key) {
            return object[key];
        });
    }
    
    vm.download = function() {
        var samplesCsv = getSamplesCsv()
        downloadVarAsFile('samplesheet_edited',samplesCsv, '.csv')
    }

    function getSamplesCsv(){
        var samplesCsv = $scope.vm.samplesOutput.map(function(sampleObj){
            return sampleObj.origSample + ',' + sampleObj.newSample
        })
        return samplesCsv.join('\n')
    }

    vm.sendemail = function() {
        var dataJson = { formData: vm.infoFormData, 
                         csvContent: getSamplesCsv()}

        $http.post('/api/sendemail', dataJson)
            .success(function(data) {
                console.log(data);
                vm.gotoStep(5)
            });
    }

    $scope.submitted = false;
    $scope.submitForm = function(isValid,nextStep) {
        $scope.submitted = true;
        // check to make sure the form is completely valid
        if (isValid) {
            if(nextStep == 5)
                vm.sendemail()
            else
                vm.gotoStep(nextStep)
        }

    };

    $scope.addConditionClicked = false;

    $scope.addCondition = function () {
        $scope.addConditionClicked = true;
        if($scope.conditionExists())
            return

        var newCondition = vm.newCondition.trim()

        if (!newCondition) {
            return;
        }

        // vm.conditions.unshift(newCondition)
        vm.conditions.push(newCondition)
        vm.newCondition = '';
        $scope.addConditionClicked = false;
    }
    $scope.deleteCondition = function(condition) {
        vm.conditions = vm.conditions.filter(c => c != condition)
    }

    $scope.conditionExists = function(){
        return vm.conditions.indexOf(vm.newCondition) > -1
    }

    $scope.$watch('vm.conditions', function () {
        if(vm.conditions.length < 1 && vm.currentStep == 2)
            $scope.userForm.conditionName.$setValidity('count', false);
        else if(vm.conditions.length > 0 && vm.currentStep == 2)
            $scope.userForm.conditionName.$setValidity('count', true);
    }, true);

    $scope.$watch('userForm.conditionName', function () {
        if(vm.conditions.length < 1 && vm.currentStep == 2)
            $scope.userForm.conditionName.$setValidity('count', false);
    }, true);

    $scope.addSampleClicked = false;
    $scope.addSample = function () {
            $scope.addSampleClicked = true;

			var newSample = {
				name: vm.newSample.trim(),
                condition: vm.newSampleCondition,
                replicate: vm.newReplicate
			};

			if (!newSample.name) {
				return;
			}

            var newName = newSample.condition + '_' +newSample.replicate

            if($scope.conditionRepExists())
                return

            for(var i=0; i< vm.samplesOutput.length; i++)
            {
                if(vm.samplesOutput[i].newSample == newName)
                    return;
            }

            //vm.samplesOutput.unshift({ origSample: newSample.name, newSample: newName})
            vm.samplesOutput.push({ origSample: newSample.name, newSample: newName})
            var indexToRemove = vm.sampleNamesCurrent.indexOf(vm.newSample.trim())
            vm.sampleNamesCurrent.splice(indexToRemove,1)
            vm.newSample = '';
            vm.newSampleCondition = ''
            vm.newReplicate = ''

            $scope.addSampleClicked = false;
    }
    $scope.deleteSample = function(sample) {
        vm.samplesOutput= vm.samplesOutput.filter(c => c != sample)
        vm.sampleNamesCurrent.unshift(sample.origSample)
    }
    $scope.conditionRepExists = function(){
        var conditionRepList = vm.samplesOutput.map(function(sample){
            return sample.newSample
        })
        return conditionRepList.indexOf(vm.newSampleCondition + '_' + vm.newReplicate) > -1
    }


    $scope.$watch('formData', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);


    vm.csvFileContent = []
    $scope.fileNameChanged = function(inputElem) {
        var files = inputElem.files;
        if (files.length) {
          var r = new FileReader();
          r.onload = function(e) {
              var contents = e.target.result;
              var lines = contents.split('\n')
              var dataIndex = -1
              for(var i=0; i<lines.length; i++)
              {
                  if(lines[i].indexOf('[Data]') > -1)
                  {
                      dataIndex = i;
                      break;
                  }
              }

              if(dataIndex == -1)
                return

              var columnNames = lines[dataIndex+1].split(',')

              var LaneColumnIndex = columnNames.indexOf('Lane')
              var sampleIdColumnIndex = columnNames.indexOf('Sample_ID')

              lines.splice(0,dataIndex+2)
              
              var sampleNames = []

              for(var i=0; i<lines.length; i++)
              {
                  var line = lines[i].split(',')
                  var laneNum = LaneColumnIndex > -1 ? parseInt(line[LaneColumnIndex]) : 1
                  if(vm.lanes[laneNum-1])
                  {
                      vm.sampleNames.push(line[sampleIdColumnIndex])
                      vm.sampleNamesCurrent.push(line[sampleIdColumnIndex])
                      sampleNames.push({ lane: laneNum, name: line[sampleIdColumnIndex]})
                  }
              }

              //var linesHtml = sampleNames.join('<br>')
              $scope.$apply(function () {
                vm.csvFileContent = sampleNames// $sce.trustAsHtml(linesHtml);
                inputElem.value = ''
              });
          };
          
          r.readAsText(files[0]);
        }
    }

    

    $scope.addNewGlobal = function()
    {
        var globalObj ={};
        globalObj[$scope.tempnewname] = "";
        $scope.global.unshift(globalObj)
        $('#newGlobalDialog').modal('toggle');
        $scope.tempnewname = ""
    }
})

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));    
        } else 
        //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
        if (i == key && obj[i].indexOf(val) > -1 || i == key && val == '') { //
            objects.push(obj);
        } else if (obj[i] == val && key == ''){
            //only add if the object is not already in the array
            if (objects.lastIndexOf(obj) == -1){
                objects.push(obj);
            }
        }
    }
    return objects;
}

app.filter('range', function() {
  return function(input, min, max) {
    min = parseInt(min); //Make string input int
    max = parseInt(max);
    for (var i=min; i<max; i++)
      input.push(i);
    return input;
  };
});

app.directive('formRepeat', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      transclude: true,
      scope: {
        ngModel: '=',
        min: '@'
      },
    //   template: '<div data-ng-repeat="item in ngModel"><div data-ng-transclude></div></div>',
      template: '<tr ng-repeat="condition in ngModel"><td data-ng-transclude></td></tr>',
      link: function (scope, element, attributes, ngModelCtrl) {
        
        scope.$watch('ngModel', function () {
          ngModelCtrl.$setValidity('count', scope.ngModel.length >= scope.min);
        }, true);
      }
    };
  });
                              

function downloadVarAsFile(title, text, ext){
	var textToSave = text;
	var hiddenElement = document.createElement('a');
	hiddenElement.href = 'data:application/octet-stream,' + encodeURI(textToSave);
	hiddenElement.target = '_blank';
	hiddenElement.download = title + ext;
	hiddenElement.click();
}

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

