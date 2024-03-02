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
    execSync(`git init`, {maxBuffer: 104857600});
    addRemote(heroku.app_name);

    execSync(`git branch -M main`, {maxBuffer: 104857600});
    execSync(`git add .`, {maxBuffer: 104857600});
    execSync(`git commit --allow-empty -am "Empty-Commit"`, {maxBuffer: 104857600});

    addEnvConfigVars(heroku.app_name);

    execSync(`git push heroku main:main`, {maxBuffer: 104857600});
    console.log(`Success : git push heroku main:main`);
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