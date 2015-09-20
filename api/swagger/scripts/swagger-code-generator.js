var fs = require('fs'),
    CodeGen = require('swagger-js-codegen').CodeGen,
    file = './api/swagger/schemas/spec-schema.json';

module.exports = function (framework, destinationFile, fileFormat, destinationFolder) {
    'use strict';
    try {
        var swagger = JSON.parse(fs.readFileSync(file, 'UTF-8')),
            sourceCode, destinationPath = destinationFolder + destinationFile + fileFormat;
        switch (framework) {
            case 'nodejs':
                sourceCode = CodeGen.getNodeCode({className: destinationFile || 'Test', swagger: swagger});
                break;
            case 'angularjs':
                sourceCode = CodeGen.getAngularCode({className: destinationFile || 'Test', swagger: swagger});
                break;
            //TODO custom
            default:
                sourceCode = '';
        }

        fs.writeFile(destinationPath, sourceCode, function (err) {
            if (err) {
                console.log('Error for this params: ' + framework + ' ' + destinationFile + ' ' + fileFormat + ' ' + destinationFolder + ' ' + destinationPath);
                throw err;
            }
        });

        return sourceCode || 'Error: \'framework\' not found';
    } catch (e) {
        console.log(e);
        throw e;
    }
};