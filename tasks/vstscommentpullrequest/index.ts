import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import * as web from 'vso-node-api/WebApi';
import { WebApi } from 'vso-node-api/WebApi';
import { access } from 'fs';

import { IGitApi } from 'vso-node-api/GitApi';
import * as gitInterfaces from 'vso-node-api/interfaces/GitInterfaces';
import { GitPullRequestCommentStatus } from 'vso-node-api/interfaces/TfvcInterfaces';

var gitClient: IGitApi;
var repoId: string;
var prNumber: number;
var commentDescriptor: string;
var singletonComment: boolean;
var latestIterationFetched: boolean;
var latestIterationId: number;

async function run() {
    // If not running on a Pull Request, stop
    stopOnNonPrBuild();

    try {
        var comment: string = tl.getInput("comment",true);
        var accountUri: string = tl.getVariable("System.TeamFoundationCollectionUri");
        var accessToken = getBearerToken();

        repoId = tl.getVariable("Build.Repository.Id");
        commentDescriptor = tl.getInput("commentDescriptor",true);
        singletonComment = tl.getBoolInput("singletonComment", true);
        prNumber = getPullRequestId();

        var creds = web.getBearerHandler(accessToken);
        var connection = new WebApi(accountUri, creds);
        gitClient = connection.getGitApi();

        if(singletonComment) {
            await deleteExistingPullRequestComment();
        }
        await addPullRequestComment(comment);
        console.log("Pull request comment: " + comment);
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

async function fetchLatestIterationId(): Promise<void> {
    if (!latestIterationFetched) {
        let iterations: gitInterfaces.GitPullRequestIteration[]
            = await gitClient.getPullRequestIterations(repoId, prNumber);

        latestIterationId = Math.max.apply(Math, iterations.map(i => i.id));
        latestIterationFetched = true;
    }
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

async function deleteExistingPullRequestComment(): Promise<void> {
    await fetchLatestIterationId();
    let threads = await gitClient.getThreads(repoId, prNumber, undefined, latestIterationId);
    let descriptorThreads = threads.filter(th => {
        return !th.isDeleted && // a thread is marked as "deleted" if all its comments are deleted
            th.properties &&
            th.properties[commentDescriptor] &&
            th.properties[commentDescriptor].$value === 1; // $ is not a mistake here
    });
    let deletePromises: Promise<void>[] = [];
    descriptorThreads.forEach(thread => {
        let visibleComments = thread.comments.filter(c => !c.isDeleted);

        if (visibleComments.length > 0) {
            visibleComments.forEach(c => {
                let deletePromise = gitClient.deleteComment(repoId, prNumber, thread.id, c.id);
                deletePromises.push(deletePromise);
            });
        }
    });

    await Promise.all(deletePromises);
}

async function addPullRequestComment(content: string): Promise<void> {
    await fetchLatestIterationId();
    var thread = createThread(content, commentDescriptor);
    await gitClient.createThread(thread,repoId,prNumber);
}

function createComment(content: string): gitInterfaces.Comment[] {
    let comment = {
        parentCommentId: 0,
        content: content,
        commentType: gitInterfaces.CommentType.System
    } as gitInterfaces.Comment;

    return [comment];
}

function createThread(content: string, commentDescriptor: string): gitInterfaces.GitPullRequestCommentThread {
    let thread = {
        comments: createComment(content),
        isDeleted: false,
        properties: getGitOpsPRCommentProperty(commentDescriptor),
        status: gitInterfaces.CommentThreadStatus.Closed,
        pullRequestThreadContext: createCommentContext()
    } as gitInterfaces.GitPullRequestCommentThread;

    return thread;
}

function createCommentContext(): gitInterfaces.GitPullRequestCommentThreadContext {
    return {
        // let the server compute the changeTrackingId, which is used to reposition comments in future iterations
        changeTrackingId: 0,

        // create the comment as if looking at the current iteration compared to the first 
        iterationContext:
        {
            firstComparingIteration: 1,
            secondComparingIteration: latestIterationId
        },
        trackingCriteria: {

        } as gitInterfaces.CommentTrackingCriteria
    };
}

function getGitOpsPRCommentProperty(commentDescriptor: string) {
    let properties: any = {};
    properties[commentDescriptor] = {
        type: 'System.Int32',
        value: 1
    };
    return properties;
}
run();