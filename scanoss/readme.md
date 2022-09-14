 how to integrate SCANOSS to your Continuous Integration Pipeline from github by using TheEye as the choreographer on a single machine. 
 
 First step is to install theeye. This tutorial was writing using Ubuntu 22.04. For achieving this task you need to clone our repository and run quickstart.sh

 ```
git clone https://github.com/theeye-io-team/theeye-of-sauron.git
 ./quickstart.sh
```
Once is finished, please login navigate to http://localhost: port 6080
and complete with the credentials provided by the installer (change this if your are planing to expose to the internet).

Second step is to import the SCANOSS provided in this repo, download the SCANOSS workflow and Import it into Theeye


You’ll need to set: 
1- Github repository, which works with private and public repositories. But for this tutorial we are working on a public repository.
2- Deployment approvers, in this demo both are the same. 
3-The ones who receive the notification, in this demo, again, both are the same.
4- And you should configure a Webhook to continue the deployment. However In this tutorial We are not setting this.

Once set up, we encourage you to manually play the workflow to see what happens.
We can see that it finds a deviation and asks for its approval, and we are done.

We can start this workflow by configuring an outgoing webhook from github.

And that 's it. If you have any questions write to support@theeye.io or create a ticket in this repository

Thanks.
