import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import * as gitops from "common-gitops";

async function run() {
    try {
        var serviceName: string = tl.getInput("servicename",true);
        var env: string = tl.getInput("environment");
        var prNumber = gitops.getPullRequestId();

        console.log("serviceName: " + serviceName);
        console.log("env: " + env);
        console.log("prNumber: " + prNumber);

        var namespace = await gitops.generateNamespace(serviceName, env, prNumber);
        gitops.setOutputVariable("namespace",namespace.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();