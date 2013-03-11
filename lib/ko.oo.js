!function(){

    function createWraper(orig) {
        var f = function() {
            orig.apply(this, arguments);
            this._wrapperCallback();
        };
        f._isWraper = true;
        return f;
    }

    function getOO(object,wrapperCallback) {
        if (!object || typeof object != 'object')
            throw new Error('Wrong input parameter!');
        var F = function() {
            this._isOO = true;
            this._wrapperCallback = wrapperCallback;
        };
        F.prototype = object;
        var rw = new F();
        if ( typeof object == 'object') {
            for (var i in object) {
                if (object.hasOwnProperty(i)) {
                    if ( typeof object[i] == 'object')   rw[i] = getOO(object[i],wrapperCallback);
                    if ( typeof object[i] == 'function') rw[i] = createWraper(object[i]);
                }
            }
        }
        return rw;
    }
    
    function checkDirty(dirty,orig,changed,level){
        var oldVal;
        for(var i in dirty){
            if(dirty.hasOwnProperty(i) && !(i in {'_isOO':true, '_wrapperCallback': true})) {
                if(dirty[i]._isOO) checkDirty(dirty[i],orig[i],changed,(level||'')+(level?'.':'')+i)
                else
                if ( typeof dirty[i] != 'function') {
                    if (dirty[i] != orig[i]) {
                        oldVal = orig[i]; 
                        orig[i] = dirty[i];
                        delete dirty[i];
                        changed((level||'')+(level?'.':'')+i,oldVal,orig[i]);
                    }
                }
                else {
                    if(!dirty[i]._isWraper){
                        oldVal = orig[i];
                        if(dirty[i] != orig[i]) var doChanged = true;
                        orig[i] = dirty[i];
                        dirty[i] = createWraper(orig[i]);
                        if(doChanged) changed((level||'')+(level?'.':'')+i,oldVal,orig[i]);
                    }
                }

            }
        }
    }
    
    function observableObject(object){
     
        var d = getOO(object, check), o = ko.computed(function() {
            setTimeout(check, 0);
            return d;
        });

        function check() {
            checkDirty(d, object, function(level, oldVal, newVal) {
                o["notifySubscribers"](d);
                o["notifySubscribers"]({
                    propertyName : level,
                    oldVal : oldVal,
                    newVal : newVal
                }, 'propertyChange');
            });
        }

        return o;

    }
    
    ko.observableObject = observableObject;
    
}();
