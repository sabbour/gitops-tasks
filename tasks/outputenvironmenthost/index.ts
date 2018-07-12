import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var serviceName: string = tl.getInput("servicename",true);
        var env: string = tl.getInput("environment",true);
        var clusterSuffix: string = tl.getInput("clustersuffix",true);
        var buildNumber = tl.getVariable("Build.BuildNumber");

        console.log("serviceName: " + serviceName);
        console.log("env: " + env);
        console.log("buildNumber: " + buildNumber);
        console.log("clusterSuffix: " + clusterSuffix);
        
        var hostname = "";
        if(env != undefined && env != null && env.trim() != "")
            hostname = serviceName + "-" + env + "-" + buildNumber + "." + clusterSuffix;
        else
            hostname = serviceName + "-" + buildNumber + "." + clusterSuffix;

        // Set it
        console.log("Generated hostname: " + hostname.toLowerCase());
        console.log("##vso[task.setvariable variable=environmenthostname;isOutput=true;]"+hostname.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();