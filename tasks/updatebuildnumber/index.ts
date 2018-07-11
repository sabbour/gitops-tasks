import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var buildReason = tl.getVariable("Build.Reason");
        var sourceBranchName = tl.getVariable("Build.SourceBranchName");
        var targetePullRequestBranchName = getTargetBranchName();
        //var gitCommitId = tl.getVariable("Build.SourceVersion");
        var buildId = tl.getVariable("Build.BuildId");
        var prNumber = tl.getVariable("System.PullRequest.PullRequestId");
        if(prNumber == undefined)
            prNumber = tl.getVariable("System.PullRequest.PullRequestNumber"); 

        //var prNumber = getPullRequestId();

        console.log("buildReason: " + buildReason);
        console.log("buildId: " + buildId);
        console.log("sourceBranchName: " + sourceBranchName);
        console.log("targetePullRequestBranchName: " + targetePullRequestBranchName);
        console.log("prNumber: " + prNumber);


        var buildTag = "";

        // Shorten the commit id
        /*
        var shortCommitId = gitCommitId;
        if(gitCommitId.length>3)
            shortCommitId = gitCommitId.substring(0,3);
        */
        // If it is a pull request
        if(buildReason == "PullRequest" && prNumber != null) {
            buildTag = targetePullRequestBranchName+"-pr-" + prNumber + "-" + buildId;
        }
        else {
            buildTag = sourceBranchName + "-" + buildId;
        }

        // Set it
        console.log("##vso[build.updatebuildnumber]"+buildTag.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
function getTargetBranchName() {
    let targetBranch: string = tl.getVariable('System.PullRequest.TargetBranch');
    
    if(targetBranch == undefined)
        return null;
    if (!targetBranch.startsWith('refs/heads/'))
        return null;

    return targetBranch.replace('refs/heads/', '');
}

run();