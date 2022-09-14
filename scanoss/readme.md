 # How to integrate SCANOSS to your Continuous Integration Pipeline from github by using TheEye as the choreographer on a single machine.
 
 <img src="./images/imagen1.png" width="80%" height="auto" >

If you want, check this 2 mins video:
[![Alt text](https://img.youtube.com/vi/GxjtUZ6cnKI/0.jpg)](https://youtu.be/GxjtUZ6cnKI)

## Lets Begin
## First step is to install theeye. 
This tutorial was writing using Ubuntu 22.04. For achieving this task you need to clone our repository and run quickstart.sh

Please run:
 ```
git clone https://github.com/theeye-io-team/theeye-of-sauron.git
 ./quickstart.sh
```
## Second step is to import and configure your workflow.
<table cellspacing="0" cellpadding="0">
   <tr>
    <td> Once is finished, please login at http://localhost:6080
and complete with the credentials provided by the installer (change this if your are planing to expose to the internet).</td>
    <td> <img src="./images/imagen2.png" width="70%" height="auto" ></td>
   </tr> 
   <tr>
    <td> download SCANOSSWorkflow.json provided in this repo and import it into Theeye
    </td>
    <td> 
         <img src="./images/imagen3.png" width="70%" height="auto" >
         <img src="./images/imagen4.png" width="70%" height="auto" >
    </td>
   </tr> 
   <tr>
   <td>
       Set your Github repository, which works with private and public repositories. But for this tutorial we are working on a public repository.
   </td>
   <td>
         <img src="./images/imagen5.png" width="70%" height="auto" >
         <img src="./images/imagen6.png" width="70%" height="auto" >
   </td>
   </tr> 
   <tr>
   <td>
     Now set the deployment approvers, in this demo both are the same. 
     The ones who receive the notification, in this demo, again, both are the same.
     And you should configure a Webhook to continue the deployment. However In this tutorial We are not setting this.
   </td>
   <td>
         <img src="./images/imagen7.png" width="70%" height="auto" >
   </td>
   </tr> 
   <tr>
   <td>
     Once set up, we encourage you to manually play the workflow to see what happens.
   </td>
   <td>
         <img src="./images/imagen8.png" width="70%" height="auto" >
   </td>
   </tr> 
   <tr>
   <td>
         We can see that it finds a deviation and asks for its approval, and we are done.
   </td>
   <td>
         <img src="./images/imagen9.png" width="70%" height="auto" >
   </td>
   </tr> 
   <tr>
   <td>
         We can start this workflow by configuring an outgoing webhook from github.
   </td>
   <td>
         <img src="./images/imagen10.png" width="70%" height="auto" >
         <img src="./images/imagen11.png" width="70%" height="auto" >
         <img src="./images/imagen12.png" width="70%" height="auto" >

   </td>
   </tr> 
</table>

And that 's it. If you have any questions write to support@theeye.io or create a ticket in this repository

Please leave us a star at https://github.com/theeye-io-team/theeye-of-sauron.git

Thanks!


