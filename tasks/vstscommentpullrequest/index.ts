import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import * as web from 'vso-node-api/WebApi';
import { WebApi } from 'vso-node-api/WebApi';
import { access } from 'fs';

import { IGitApi } from 'vso-node-api/GitApi';
import * as gitInterfaces from 'vso-node-api/interfaces/GitInterfaces';
import { GitPullRequestCommentStatus } from 'vso-node-api/interfaces/TfvcInterfaces';

var gitClient: IGitApi;

async function run() {
    // If not running on a Pull Request, stop
    //stopOnNonPrBuild();

    try {
        var comment: string = tl.getInput("comment",true);
        var accountUri: string = tl.getVariable("System.TeamFoundationCollectionUri");
        var accessToken: string = tl.getVariable("System.AccessToken");
        var projectName: string = tl.getVariable("System.TeamProject");
        var repoId: string = tl.getVariable("Build.Repository.Id");
        var buildNumber: string = tl.getVariable("Build.BuildNumber");
        var prNumber: number = getPullRequestId();
        var accessToken2 = getBearerToken();

        var creds = web.getBearerHandler(accessToken2);
        var connection = new WebApi(accountUri, creds);
        gitClient = connection.getGitApi();
        await addPullRequestComment(repoId,prNumber,comment);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function stopOnNonPrBuild() {

    tl.debug('Checking if this is a PR build');
    var sourceBranch: string = tl.getVariable('Build.SourceBranch');
    if (!sourceBranch.startsWith('refs/pull/')) {
        // ="Skipping pull request commenting - this build was not triggered by a pull request."
        console.log("Not triggered by a Pull Request, skipping.");
        process.exit();
    }
}

function getPullRequestId() {
    let sourceBranch: string = tl.getVariable('Build.SourceBranch');
    var pullRequestId: number = Number.parseInt(sourceBranch.replace('refs/pull/', ''));

    if (isNaN(pullRequestId)) {
        console.log(`Expected pull request ID to be a number. Attempted to parse: ${sourceBranch.replace('refs/pull/', '')}`);
        tl.setResult(tl.TaskResult.Failed, "Could not retrieve pull request ID from the server.");
        process.exit(1);
    }

    return pullRequestId;

}

function getBearerToken() {

    tl.debug('Getting the agent bearer token');

    // Get authentication from the agent itself
    var auth = tl.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
    if (auth.scheme !== 'OAuth') {
        // Looks like: "Could not get an authentication token from the build agent."
        console.log("Could not get an authentication token from the build agent.");
    }

    return auth.parameters['AccessToken'];
}

async function addPullRequestComment(repoId: string, prId: number, content: string) {
    console.log("addPullRequestComment repo" + repoId + " pr: " + prId + " content: " + content);
    var thread = createThread(content);
    await gitClient.createThread(thread,repoId,prId);
}

function createComment(content: string): gitInterfaces.Comment[] {
    let comment = {
        // PRCA messages apear as single comments
        parentCommentId: 0,
        content: content,
        commentType: gitInterfaces.CommentType.Text
    } as gitInterfaces.Comment;

    return [comment];
}

function createThread(content: string): gitInterfaces.GitPullRequestCommentThread {
    let thread = {
        comments: createComment(content),
        isDeleted: false,
        properties: getGitOpsPRCommentProperty(),
        status: gitInterfaces.CommentThreadStatus.Active
    } as gitInterfaces.GitPullRequestCommentThread;

    return thread;
}

function getGitOpsPRCommentProperty() {
    let properties: any = {};
    properties["GitOps.PreviewPRComment"] = {
        type: 'System.Int32',
        value: 1
    };
    return properties;
}
run();