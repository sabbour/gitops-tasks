import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var buildReason = tl.getVariable("Build.Reason");
        var sourceBranchName = tl.getVariable("Build.SourceBranchName");
        var targetePullRequestBranchName = getTargetBranchName();
        var gitCommitId = tl.getVariable("Build.SourceVersion");
        var buildId = tl.getVariable("Build.BuildId");
        var prNumber = tl.getVariable("System.PullRequest.PullRequestId");
        if(prNumber == undefined)
            prNumber = tl.getVariable("System.PullRequest.PullRequestNumber"); 

        //var prNumber = getPullRequestId();

        console.log("buildReason: " + buildReason);
        console.log("buildId: " + buildId);
        console.log("sourceBranchName: " + sourceBranchName);
        console.log("targetePullRequestBranchName: " + targetePullRequestBranchName);
        console.log("gitCommitId: " + gitCommitId);
        console.log("prNumber: " + prNumber);


        var buildTag = "";

        // Shorten the commit id
        var shortCommitId = gitCommitId;
        if(gitCommitId.length>3)
            shortCommitId = gitCommitId.substring(0,2);
        
        // If it is a pull request
        if(buildReason == "PullRequest" && prNumber != null) {
            buildTag = targetePullRequestBranchName+"-pr-" + prNumber + "-" + shortCommitId + "-" + buildId;
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
function getTargetBranchName() {
    let targetBranch: string = tl.getVariable('System.PullRequest.TargetBranch');
    if (!targetBranch.startsWith('refs/heads/')) {
        return null;
    }

    return targetBranch.replace('refs/heads/', '');
}

function getPullRequestId() {
    let sourceBranch: string = tl.getVariable('Build.SourceBranch');
    if (!sourceBranch.startsWith('refs/pull/')) {
        return null;
    }

    var pullRequestId: number = Number.parseInt(sourceBranch.replace('refs/pull/', ''));

    if (isNaN(pullRequestId)) {
        console.log(`Expected pull request ID to be a number. Attempted to parse: ${sourceBranch.replace('refs/pull/', '')}`);
        tl.setResult(tl.TaskResult.Failed, "Could not retrieve pull request ID from the server.");
        process.exit(1);
    }

    return pullRequestId;
}

run();