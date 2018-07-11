import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var buildReason = tl.getInput("buildReason",true);
        var sourceBranchName = tl.getInput("sourceBranchName",true);
        var gitCommitId = tl.getInput("gitCommitId",true);
        var buildId = tl.getInput("buildId",true);
        var prNumber = tl.getInput("prNumber",(buildReason == "PullRequest")); // required if build reason is PR

        var buildTag = "";

        // Shorten the commit id
        var shortCommitId = gitCommitId;
        if(gitCommitId.length>7)
            shortCommitId = gitCommitId.substring(0,7);
        
        // If it is a pull request
        if(buildReason == "PullRequest" && prNumber != null) {
            buildTag = sourceBranchName + "-pr-" + prNumber + "-" + shortCommitId + "-" + buildId;
        }
        else {
            buildTag = sourceBranchName + "-" + shortCommitId + "-" + buildId;
        }

        // Set it
        console.log("##vso[build.updatebuildnumber]"+buildTag.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();