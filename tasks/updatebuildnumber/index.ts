import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var buildReason = tl.getVariable("Build.Reason");
        var sourceBranchName = tl.getVariable("Build.SourceBranchName");
        var buildId = tl.getVariable("Build.BuildId");
        var prNumber = tl.getVariable("System.PullRequest.PullRequestId");
        if(prNumber == undefined)
            prNumber = tl.getVariable("System.PullRequest.PullRequestNumber"); 

        //var prNumber = getPullRequestId();

        console.log("buildReason: " + buildReason);
        console.log("buildId: " + buildId);
        console.log("sourceBranchName: " + sourceBranchName);
        console.log("prNumber: " + prNumber);


        var buildTag = "";

        // If it is a pull request
        if(buildReason == "PullRequest" && prNumber != null) {
            buildTag = "pr-" + prNumber + "-" + buildId;
        }
        else {
            buildTag = sourceBranchName + "-" + buildId;
        }

        // Set it
        console.log("buildTag: " + buildTag.toLowerCase());
        console.log("##vso[build.updatebuildnumber]"+buildTag.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();