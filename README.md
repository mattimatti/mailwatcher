# mailwatcher
Nodejs console application. 

- Acts as a watchfolder on a folder and subfolders.
- Upon creation of a certain file pushes the file to a well known drobpox account.
- Send an email to the recipient with html embedded the the image.



Prerequisites

- Install Node v0.12.2 or later
- Install NPM 2.7.4
- Must have Administrator privileges to install globally.


For developers:

- Install Grunt

In your shell:

    npm install grunt-cli -git
    npm install
    grunt


Install

    git clone https://github.com/mattimatti/mailwatcher.git
    cd mailwatcher
    npm install
    sudo npm install -g // install the app

    cp .config.json.dist .config.json

Edit your config file

	nano .config.json

Once the config is ok Psh the file

    mailwatcher