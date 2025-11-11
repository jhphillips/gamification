/*
SCORM API Wrapper for Articulate, Lectora, Captivate, and others.
Version 1.2.6 - 2018-03-22
by Philip Hutchison, philip@pipwerks.com
https://pipwerks.com/

MIT License

Copyright (c) 2018 Philip Hutchison

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var pipwerks = {}; //pipwerks 'namespace' helps prevent naming conflicts
pipwerks.UTILS = {}; //Generic utilities
pipwerks.SCORM = {
    //Specific SCORM functionality
    version: null, //Store SCORM version.
    handleCompletionStatus: true, //Whether or not the wrapper should automatically handle the initial completion status
    handleExitMode: true, //Whether or not the wrapper should automatically handle the exit mode
    API: {
        handle: null,
        isFound: false
    }, //Store reference to SCORM API
    connection: {
        isActive: false
    }, //Track connection status
    data: {
        completionStatus: null,
        exitStatus: null
    }, //Track course data
    debug: {
        isActive: true,
        toString: function () {
            return "pipwerks.SCORM.debug";
        }
    } //Enable (default) or disable debug logging
};
pipwerks.SCORM.isAvailable = function () {
    return true;
};
pipwerks.SCORM.API.find = function (win) {
    if (win.API_1484_11) {
        pipwerks.SCORM.version = "2004";
        pipwerks.SCORM.API.handle = win.API_1484_11;
    } else if (win.API) {
        pipwerks.SCORM.version = "1.2";
        pipwerks.SCORM.API.handle = win.API;
    }
    if (pipwerks.SCORM.API.handle) {
        pipwerks.SCORM.API.isFound = true;
    } else if (!win.parent || win.parent == win) {
        return;
    } else {
        pipwerks.SCORM.API.find(win.parent);
    }
};
pipwerks.SCORM.init = function () {
    if (!pipwerks.SCORM.connection.isActive) {
        pipwerks.SCORM.API.find(window);
        if (pipwerks.SCORM.API.isFound) {
            var scorm = pipwerks.SCORM;
            var trace = pipwerks.UTILS.trace;
            trace(scorm.toString() + ": SCORM API found. Version: " + scorm.version);
            switch (scorm.version) {
                case "1.2":
                    scorm.connection.isActive = scorm.API.handle.LMSInitialize("") == "true";
                    break;
                case "2004":
                    scorm.connection.isActive = scorm.API.handle.Initialize("") == "true";
                    break;
            }
            if (scorm.connection.isActive) {
                if (scorm.handleCompletionStatus) {
                    scorm.data.completionStatus = scorm.get("cmi.completion_status");
                    trace(scorm.toString() + ": cmi.completion_status = " + scorm.data.completionStatus);
                    if (scorm.data.completionStatus) {
                        switch (scorm.data.completionStatus) {
                            case "not attempted":
                                scorm.set("cmi.completion_status", "incomplete");
                                break;
                        }
                    } else {
                        trace(scorm.toString() + ": ERROR - No cmi.completion_status value found.");
                    }
                }
                if (scorm.handleExitMode) {
                    scorm.data.exitStatus = scorm.get("cmi.exit");
                    trace(scorm.toString() + ": cmi.exit = " + scorm.data.exitStatus);
                    if (!scorm.data.exitStatus || scorm.data.exitStatus === '""' || scorm.data.exitStatus === "''") {
                        scorm.set("cmi.exit", "suspend");
                        trace(scorm.toString() + ": cmi.exit now = suspend");
                    }
                }
                return true;
            } else {
                trace(scorm.toString() + ": ERROR - Could not establish connection.");
                return false;
            }
        } else {
            pipwerks.UTILS.trace(pipwerks.SCORM.toString() + ": ERROR - Could not find SCORM API.");
            return false;
        }
    } else {
        pipwerks.UTILS.trace(pipwerks.SCORM.toString() + ": WARNING - Connection already active.");
        return true;
    }
};
pipwerks.SCORM.get = function (param) {
    var scorm = pipwerks.SCORM;
    var trace = pipwerks.UTILS.trace;
    if (scorm.connection.isActive) {
        var call = "";
        var result = "";
        switch (scorm.version) {
            case "1.2":
                call = "LMSGetValue";
                break;
            case "2004":
                call = "GetValue";
                break;
        }
        result = scorm.API.handle[call](param);
        trace(scorm.toString() + ": " + call + "(" + param + ") = " + result);
        return String(result);
    } else {
        trace(scorm.toString() + ": ERROR - Could not get value. Connection not active.");
        return null;
    }
};
pipwerks.SCORM.set = function (param, value) {
    var scorm = pipwerks.SCORM;
    var trace = pipwerks.UTILS.trace;
    if (scorm.connection.isActive) {
        var call = "";
        var result = "";
        switch (scorm.version) {
            case "1.2":
                call = "LMSSetValue";
                break;
            case "2004":
                call = "SetValue";
                break;
        }
        result = scorm.API.handle[call](param, value);
        trace(scorm.toString() + ": " + call + "(" + param + ", " + value + ") = " + result);
        return result == "true" ? true : false;
    } else {
        trace(scorm.toString() + ": ERROR - Could not set value. Connection not active.");
        return false;
    }
};
pipwerks.SCORM.save = function () {
    var scorm = pipwerks.SCORM;
    var trace = pipwerks.UTILS.trace;
    if (scorm.connection.isActive) {
        var call = "";
        var result = "";
        switch (scorm.version) {
            case "1.2":
                call = "LMSCommit";
                break;
            case "2004":
                call = "Commit";
                break;
        }
        result = scorm.API.handle[call]("");
        trace(scorm.toString() + ": " + call + '("") = ' + result);
        return result == "true" ? true : false;
    } else {
        trace(scorm.toString() + ": ERROR - Could not save. Connection not active.");
        return false;
    }
};
pipwerks.SCORM.quit = function () {
    var scorm = pipwerks.SCORM;
    var trace = pipwerks.UTILS.trace;
    if (scorm.connection.isActive) {
        var call = "";
        var result = "";
        switch (scorm.version) {
            case "1.2":
                call = "LMSFinish";
                break;
            case "2004":
                call = "Terminate";
                break;
        }
        result = scorm.API.handle[call]("");
        trace(scorm.toString() + ": " + call + '("") = ' + result);
        scorm.connection.isActive = false;
        return result == "true" ? true : false;
    } else {
        trace(scorm.toString() + ": ERROR - Could not quit. Connection not active.");
        return false;
    }
};
pipwerks.UTILS.StringToBoolean = function (string) {
    switch (string.toLowerCase()) {
        case "true":
        case "yes":
        case "1":
            return true;
        case "false":
        case "no":
        case "0":
        case null:
            return false;
        default:
            return Boolean(string);
    }
};
pipwerks.UTILS.trace = function (msg) {
    if (pipwerks.SCORM.debug.isActive) {
        if (window.console && window.console.log) {
            window.console.log(msg);
        }
    }
};
