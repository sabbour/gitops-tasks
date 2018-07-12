import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var serviceName: string = tl.getInput("servicename",true);
        var clusterSuffix: string = tl.getInput("clustersuffix",true);
        var buildNumber = tl.getVariable("Build.BuildNumber");
        var buildReason = tl.getVariable("Build.Reason");
        var sourceBranchName = tl.getVariable("Build.SourceBranchName");

        console.log("serviceName: " + serviceName);
        console.log("buildReason: " + buildReason);
        console.log("buildNumber: " + buildNumber);
        console.log("sourceBranchName: " + sourceBranchName);
        console.log("System.PullRequest.PullRequestId: " + tl.getVariable("System.PullRequest.PullRequestId"));
        console.log("System.PullRequest.PullRequestNumber: " + tl.getVariable("System.PullRequest.PullRequestNumber"));
        console.log("System.PullRequest.SourceBranch: " + tl.getVariable("System.PullRequest.SourceBranch"));
        console.log("System.PullRequest.TargetBranch: " + tl.getVariable("System.PullRequest.TargetBranch"));

        var hostname = "";

        // If it is a pull request, then we want to use the build number in the hostname
        if(buildReason == "PullRequest") {
            hostname = serviceName + "-" + buildNumber + "." + clusterSuffix;
        }
        else {
            // otherwise (probably master or development), just use the branch name
            hostname = serviceName + "-" + sourceBranchName + "." + clusterSuffix;
        }

        // Set it
        console.log("Generated hostname: " + hostname.toLowerCase());
        console.log("##vso[task.setvariable variable=environmenthostname;isOutput=true;]"+hostname.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();