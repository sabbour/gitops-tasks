import * as tl from "vsts-task-lib/task";
import * as gitops from "common-gitops";

async function run() {
    try {
        var buildReason = tl.getVariable("Build.Reason");
        var sourceBranchName = tl.getVariable("Build.SourceBranchName");
        var buildId = tl.getVariable("Build.BuildId");
        var prNumber = tl.getVariable("System.PullRequest.PullRequestId");
        if(prNumber == undefined)
            prNumber = tl.getVariable("System.PullRequest.PullRequestNumber"); 

        console.log("buildReason: " + buildReason);
        console.log("buildId: " + buildId);
        console.log("sourceBranchName: " + sourceBranchName);
        console.log("prNumber: " + prNumber);

        var buildTag = await gitops.generateBuildNumber(buildReason, buildId, sourceBranchName, prNumber);
        gitops.setBuildVariable("build.updatebuildnumber",buildTag.toLowerCase());
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();