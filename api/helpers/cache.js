(function () {
    'use strict';

    function setKey(req) {
        console.log(req.swagger.params);
        // This can check for a specific query parameter ("name" in this case)
        var key = JSON.stringify(req.swagger.params);
        return key;
    }

    module.exports = {
        setKey: setKey
    };
})();
