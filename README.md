# Required Modules

    npm install express
    npm install ejs
    npm install redis
    npm install socket.io

# Usage

- Start `redis-server`.

- Import the sessions fixtures into redis:

    `./loaddata.py fixtures.json`

* Start the apps.
        
        node app.js
        node adminapp.js