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
const gitops = __importStar(require("common-gitops"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var serviceName = tl.getInput("servicename", true);
            var env = tl.getInput("environment");
            var prNumber = gitops.getPullRequestId();
            console.log("serviceName: " + serviceName);
            console.log("env: " + env);
            console.log("prNumber: " + prNumber);
            var namespace = yield gitops.generateNamespace(serviceName, env, prNumber);
            gitops.setOutputVariable("namespace", namespace.toLowerCase());
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
//# sourceMappingURL=index.js.map