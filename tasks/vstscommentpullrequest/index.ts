import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import * as web from 'vso-node-api/WebApi';
import { WebApi } from 'vso-node-api/WebApi';
import { access } from 'fs';

import { IGitApi } from 'vso-node-api/GitApi';
import * as gitInterfaces from 'vso-node-api/interfaces/GitInterfaces';
import { GitPullRequestCommentStatus } from 'vso-node-api/interfaces/TfvcInterfaces';

import * as gitops from "common-gitops";

var gitClient: IGitApi;
var repoId: string;
var prNumber: number;
var commentDescriptor: string;
var singletonComment: boolean;
var latestIterationFetched: boolean;
var latestIterationId: number;

async function run() {
    // If not running on a Pull Request, stop
    gitops.stopOnNonPrBuild();

    try {
        var comment: string = tl.getInput("comment",true);
        var status: string = tl.getInput("status",true);
        var accountUri: string = tl.getVariable("System.TeamFoundationCollectionUri");
        var accessToken = gitops.getBearerToken();

        repoId = tl.getVariable("Build.Repository.Id");
        commentDescriptor = tl.getInput("commentDescriptor",true);
        singletonComment = tl.getBoolInput("singletonComment", true);

        var pullRequestId: string = gitops.getPullRequestId();
        prNumber = Number.parseInt(pullRequestId);

        if (isNaN(prNumber)) {
            console.log(`Expected pull request ID to be a number. Attempted to parse: ${pullRequestId}`);
            tl.setResult(tl.TaskResult.Failed, "Could not retrieve pull request ID from the server.");
            process.exit(1);
        }
        
        var creds = web.getBearerHandler(accessToken);
        var connection = new WebApi(accountUri, creds);
        gitClient = connection.getGitApi();

        if(singletonComment) {
            await deleteExistingPullRequestComment();
        }
        await addPullRequestComment(comment,status);
        console.log("Pull request comment: " + comment);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

async function fetchLatestIterationId(): Promise<void> {
    if (!latestIterationFetched) {
        let iterations: gitInterfaces.GitPullRequestIteration[]
            = await gitClient.getPullRequestIterations(repoId, prNumber);

        latestIterationId = Math.max.apply(Math, iterations.map(i => i.id));
        latestIterationFetched = true;
    }
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

async function addPullRequestComment(content: string, status: string): Promise<void> {
    await fetchLatestIterationId();
    var thread = createThread(content, commentDescriptor, status);
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

function createThread(content: string, commentDescriptor: string, status: string): gitInterfaces.GitPullRequestCommentThread {
    var commentThreadStatus;
    switch(status) {
        case "Active":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.Active;
        break;
        case "ByDesign":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.ByDesign;
        break;
        case "Fixed":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.Fixed;
        break;
        case "Pending":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.Pending;
        break;
        case "Closed":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.Closed;
        break;
        case "WontFix":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.WontFix;
        break;
        case "Unknown":
        commentThreadStatus = gitInterfaces.CommentThreadStatus.Unknown;
        break;
        default:
        commentThreadStatus = gitInterfaces.CommentThreadStatus.Unknown;
    }

    let thread = {
        comments: createComment(content),
        isDeleted: false,
        properties: getGitOpsPRCommentProperty(commentDescriptor),
        status: commentThreadStatus,
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