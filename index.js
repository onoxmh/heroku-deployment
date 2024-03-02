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
    execSync("heroku git:remote --app " + app_name);
    console.log(`Success : heroku git:remote --app <name>`);
};

const addEnvConfigVars = (app_name) => {
    const herokuVars = Object.entries(process.env).map(entry => {
        if (entry[0].startsWith('HV_')) {
            entry[0] = entry[0].replace('HV_', '');
            return entry;
        }
    });

    if (herokuVars && herokuVars.length > 0) {
        const configVarsStr = herokuVars.join(' ').replaceAll(',', '=');
        console.log('configVarsStr', configVarsStr);

        execSync(`heroku config:set --app=${app_name} ${configVarsStr}`);
    }
};

const deploy = () => {
    let remote_branch = execSync("git remote show heroku | grep 'HEAD'")
        .toString()
        .trim();

    if (remote_branch.indexOf("main") > 0) {
        console.error(`Branch '${remote_branch}' is invalid.`);
        core.setFailed("Your remote branch mush be main");
    } else {
        execSync(`git push heroku main`, {maxBuffer: 104857600});
    }
};

(async () => {
    // Program logic
    try {
        console.log("process.env", process.env);
        execSync(`git config user.name "Heroku-Deploy"`);
        execSync(`git config user.email "${heroku.email}"`);

        execSync(createCredsCatFile(heroku.email, heroku.api_key));
        console.log("~/.netrc created");

        console.log("Successfully logged into heroku");

        addRemote(heroku.app_name);
        addEnvConfigVars(heroku.app_name);

        deploy();

        core.setOutput(
            "status",
            "Successfully deployed Heroku app"
        );
    } catch (err) {
        console.error('An error occured : ', err);
        core.setFailed("Impossible to deploy to Heroku.");
    }
})();