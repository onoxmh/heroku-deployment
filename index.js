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
    addRemote(heroku.app_name);

    let remote_branch = execSync("git remote show heroku | grep 'HEAD'")
        .toString()
        .trim();

    const repoExists = !remote_branch.includes("unknown");

    if (!repoExists) {
        console.log("Initializing Heroku repository")
        execSync(`git init`);
        console.log(`Success : git init`);
        execSync(`git branch -M main`);
        console.log(`Success : git branch -M main`);
        execSync(`git commit --allow-empty -m "Empty-Commit"`);
        console.log(`Success : git commit --allow-empty -m "Empty-Commit"`);
        execSync("git push -u heroku main")
        console.log(`Success : git push -u heroku main`);
    } else if (!remote_branch.includes("main")) {
        console.error(`Branch '${remote_branch}' is invalid.`);
        core.setFailed("Your remote branch mush be main");
    }

    addEnvConfigVars(heroku.app_name);

    if (repoExists) {
        execSync(`git pull heroku main`, {maxBuffer: 104857600});
        console.log(`Success : git pull heroku main`);
    }

    try {
        execSync(`git push heroku main`, {maxBuffer: 104857600});
        console.log(`Success : git push heroku main`);
    }
    catch (err) {
        console.error('Error : git push heroku main : ', err);
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
        console.error('An error occured : ', err);
        core.setFailed("Impossible to deploy to Heroku.");
    }
})();