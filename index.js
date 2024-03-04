const core = require("@actions/core");
const {execSync} = require("child_process");

// Input Variables
const heroku = {
    api_key: core.getInput("heroku_api_key"),
    email: core.getInput("heroku_email"),
    app_name: core.getInput("heroku_app_name")
};

const createCredsCatFile = (email, api_key) =>
    `cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${api_key}
machine git.heroku.com
    login ${email}
    password ${api_key}
EOF`;

const addRemote = (app_name) => {
    execSync("heroku git:remote -a " + app_name);
    console.log(`Success : heroku git:remote -a ${app_name}`);
};

const addEnvConfigVars = (app_name) => {
    const herokuVars = Object.entries(process.env).map(entry => {
        if (entry[0].startsWith('HV_')) {
            entry[0] = entry[0].replace('HV_', '');
            return entry.join('=');
        }
    });

    if (herokuVars && herokuVars.length > 0) {
        const configVarsStr = herokuVars.join(' ');
        execSync(`heroku config:set --app=${app_name} ${configVarsStr}`);
    }
};

const deploy = () => {
    if (execSync("git status").includes('not a git repository')) {
        console.log("Initializing Heroku repository");
        execSync(`git init`);
        console.log(`Success : git init`);
    }

    addRemote(heroku.app_name);

    let remote_branch = execSync("git remote show heroku | grep 'HEAD'")
        .toString()
        .trim();

    let repoExists = !remote_branch.includes("unknown");

    if (!repoExists) {
        // console.log("Initializing Heroku repository")
        // execSync(`git init`);
        // console.log(`Success : git init`);
        //
        // addRemote(heroku.app_name);
        //
        // execSync(`git branch -M main`);
        // console.log(`Success : git branch -M main`);
        // execSync(`git remote set-head heroku -a`);
        // console.log(`Success : git remote set-head origin -a`);
        // execSync('git fetch --all --unshallow');
        // console.log(`Success : git fetch --all --unshallow`);
    } else if (!remote_branch.includes("main")) {
        console.error(`Branch '${remote_branch}' is invalid.`);
        core.setFailed("Your remote branch mush be main");
    }

    addEnvConfigVars(heroku.app_name);

    try {
        const resultPush = execSync(`git push heroku HEAD:refs/heads/main`);
        console.log(`Success : git push heroku HEAD:refs/heads/main`);
    } catch (err) {
        console.error('Error : git push heroku HEAD:refs/heads/main');
    }
};

(async () => {
    // Program logic
    try {
        execSync(`git config user.name "Heroku-Deploy"`);
        execSync(`git config user.email "${heroku.email}"`);

        execSync(createCredsCatFile(heroku.email, heroku.api_key));
        console.log("~/.netrc created");

        console.log("Successfully logged into heroku");

        deploy();

        core.setOutput(
            "status",
            "Successfully deployed Heroku app"
        );
    } catch (err) {
        delete err.stack;
        console.error('An error occured : ', err.message);
        core.setFailed("Impossible to deploy to Heroku.");
    }
})();