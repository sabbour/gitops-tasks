"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const web = __importStar(require("vso-node-api/WebApi"));
const WebApi_1 = require("vso-node-api/WebApi");
const gitInterfaces = __importStar(require("vso-node-api/interfaces/GitInterfaces"));
const gitops = __importStar(require("common-gitops"));
var gitClient;
var repoId;
var prNumber;
var commentDescriptor;
var singletonComment;
var latestIterationFetched;
var latestIterationId;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // If not running on a Pull Request, stop
        gitops.stopOnNonPrBuild();
        try {
            var comment = tl.getInput("comment", true);
            var status = tl.getInput("status", true);
            var accountUri = tl.getVariable("System.TeamFoundationCollectionUri");
            var accessToken = gitops.getBearerToken();
            repoId = tl.getVariable("Build.Repository.Id");
            commentDescriptor = tl.getInput("commentDescriptor", true);
            singletonComment = tl.getBoolInput("singletonComment", true);
            var pullRequestId = gitops.getPullRequestId();
            prNumber = Number.parseInt(pullRequestId);
            if (isNaN(prNumber)) {
                console.log(`Expected pull request ID to be a number. Attempted to parse: ${pullRequestId}`);
                tl.setResult(tl.TaskResult.Failed, "Could not retrieve pull request ID from the server.");
                process.exit(1);
            }
            var creds = web.getBearerHandler(accessToken);
            var connection = new WebApi_1.WebApi(accountUri, creds);
            gitClient = connection.getGitApi();
            if (singletonComment) {
                yield deleteExistingPullRequestComment();
            }
            yield addPullRequestComment(comment, status);
            console.log("Pull request comment: " + comment);
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
function fetchLatestIterationId() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!latestIterationFetched) {
            let iterations = yield gitClient.getPullRequestIterations(repoId, prNumber);
            latestIterationId = Math.max.apply(Math, iterations.map(i => i.id));
            latestIterationFetched = true;
        }
    });
}
function deleteExistingPullRequestComment() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchLatestIterationId();
        let threads = yield gitClient.getThreads(repoId, prNumber, undefined, latestIterationId);
        let descriptorThreads = threads.filter(th => {
            return !th.isDeleted && // a thread is marked as "deleted" if all its comments are deleted
                th.properties &&
                th.properties[commentDescriptor] &&
                th.properties[commentDescriptor].$value === 1; // $ is not a mistake here
        });
        let deletePromises = [];
        descriptorThreads.forEach(thread => {
            let visibleComments = thread.comments.filter(c => !c.isDeleted);
            if (visibleComments.length > 0) {
                visibleComments.forEach(c => {
                    let deletePromise = gitClient.deleteComment(repoId, prNumber, thread.id, c.id);
                    deletePromises.push(deletePromise);
                });
            }
        });
        yield Promise.all(deletePromises);
    });
}
function addPullRequestComment(content, status) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchLatestIterationId();
        var thread = createThread(content, commentDescriptor, status);
        yield gitClient.createThread(thread, repoId, prNumber);
    });
}
function createComment(content) {
    let comment = {
        parentCommentId: 0,
        content: content,
        commentType: gitInterfaces.CommentType.System
    };
    return [comment];
}
function createThread(content, commentDescriptor, status) {
    var commentThreadStatus;
    switch (status) {
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
    };
    return thread;
}
function createCommentContext() {
    return {
        // let the server compute the changeTrackingId, which is used to reposition comments in future iterations
        changeTrackingId: 0,
        // create the comment as if looking at the current iteration compared to the first 
        iterationContext: {
            firstComparingIteration: 1,
            secondComparingIteration: latestIterationId
        },
        trackingCriteria: {}
    };
}
function getGitOpsPRCommentProperty(commentDescriptor) {
    let properties = {};
    properties[commentDescriptor] = {
        type: 'System.Int32',
        value: 1
    };
    return properties;
}
run();
//# sourceMappingURL=index.js.map