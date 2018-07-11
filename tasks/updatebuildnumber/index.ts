import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var buildReason = tl.getInput("buildReason",true);
        var sourceBranchName = tl.getInput("sourceBranchName",true);
        var gitCommitId = tl.getInput("gitCommitId",true);
        var buildId = tl.getInput("buildId",true);
        var prNumberInput = tl.getInput("prNumber",true);
        var prNumber = getPullRequestId();

        console.log("buildReason: " + buildReason);
        console.log("buildId: " + buildId);
        console.log("sourceBranchName: " + sourceBranchName);
        console.log("prNumber: " + prNumber);
        console.log("prNumberInput: " + prNumberInput);


        var buildTag = "";

        // Shorten the commit id
        var shortCommitId = gitCommitId;
        if(gitCommitId.length>7)
            shortCommitId = gitCommitId.substring(0,7);
        
        // If it is a pull request
        if(prNumber != null) {
            buildTag = "pr-" + prNumber + "-" + shortCommitId + "-" + buildId;
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