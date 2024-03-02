# HOW TO USE ACTION

## Setup workflow
This GitHub Action requires theses inputs :
- `heroku_api_key` : This is needed for authentication. 
  - The API key is found on [Heroku](https://dashboard.heroku.com/account) in `Account Settings`.
- `heroku_app_name` : The app name to deploy to.
- `heroku_email` : The email of the Heroku app owner.


**Warning**: Make sure to create <span style="color:crimson;">repository secrets</span> since there is <span style="color:crimson;">sensitive information</span>
that is used by this GitHub Action.

To create a <span style="color:orange;">repository secret</span> :
- Go to repository
- Go to the `Settings` tab
- Find the `Secrets and variables / Actions` menu
- In the `Repository secrets` section, click on `New repository secret`


> Job example :
.../.github/workflows/<workflow-name>.yml
```yaml
jobs:
   deploy:
       runs-on: ubuntu-latest
       steps:
           - name: Checkout
             uses: actions/checkout@v4
           - name: Heroku deploy
             uses: onoxmh/heroku-deployment@main
             with:
                 heroku_api_key: ${{secrets.HEROKU_API_KEY}}
                 heroku_app_name: your-app-name
                 heroku_email: ${{secrets.HEROKU_EMAIL}}
```

### Setup Heroku ``Config Vars`` / `.env` vars
You need to define the <span style="color:orange;">repository environment</span> to use.

To create the environment variables :
- Go to your repository and go to `Settings/Environments`
- Create a new environment that'll contain you environment variables.
- Add your environment variables as `Environment secrets`
  - The <span style="color:crimson;">name</span> of the environment secrets <span style="color:crimson;">must begin</span> with <span style="color:orange;">HV_</span>
- Define job property `environment` with the created repository environment name
- Define `env` such as the example bellow

> Job using GitHub environment example :
.../.github/workflows/<workflow-name>.yml
```yaml
jobs:
   deploy:
       runs-on: ubuntu-latest
       environment: <your-environment-name>
       steps:
           - name: Checkout
             uses: actions/checkout@v4
           - name: Heroku deploy
             uses: onoxmh/heroku-deployment@main
             env:
               HV_VAR: ${{secrets.HV_VAR}}
             with:
                 heroku_api_key: ${{secrets.HEROKU_API_KEY}}
                 heroku_app_name: <your-app-name>
                 heroku_email: ${{secrets.HEROKU_EMAIL}}
```