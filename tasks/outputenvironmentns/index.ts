import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var serviceName: string = tl.getInput("servicename",true);
        var env: string = tl.getInput("environment");
        var buildNumber = tl.getVariable("Build.BuildNumber");
        var includeBuildNumber = tl.getBoolInput("includeBuildNumber", true);

        console.log("serviceName: " + serviceName);
        console.log("env: " + env);
        console.log("buildNumber: " + buildNumber);
        console.log("includeBuildNumber: " + includeBuildNumber);

        var namespace = "";
        if(includeBuildNumber) {
            if(env != undefined && env != null && env.trim() != "")
                namespace = serviceName + "-" + env + "-" + buildNumber;
            else
                namespace = serviceName + "-" + buildNumber;
        }
        else {
            if(env != undefined && env != null && env.trim() != "")
                namespace = serviceName + "-" + env;
            else
                namespace = serviceName;
        }

        // Set it
        console.log("Generated namespace: " + namespace.toLowerCase());
        console.log("##vso[task.setvariable variable=namespace;isOutput=true;]"+namespace.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();