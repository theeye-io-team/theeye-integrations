 #how to integrate SCANOSS to your Continuous Integration Pipeline from github by using TheEye as the choreographer on a single machine. 
<iframe width="560" height="315" src="https://www.youtube.com/embed/GxjtUZ6cnKI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

 <img src="./images/image1.png">

## Lets Begin
## First step is to install theeye. This tutorial was writing using Ubuntu 22.04. For achieving this task you need to clone our repository and run quickstart.sh

Please run:
 ```
git clone https://github.com/theeye-io-team/theeye-of-sauron.git
 ./quickstart.sh
```

<table cellspacing="0" cellpadding="0">
   <tr>
    <td> <img src="./images/imagen2.png"></td>
    <td> Once is finished, please login navigate to http://localhost: port 6080
and complete with the credentials provided by the installer (change this if your are planing to expose to the internet).</td>
   </tr> 
   <tr>
    <td> 
         <img src="./images/imagen3.png">
         <img src="./images/imagen4.png">
    </td>
    <td> download SCANOSSWorkflow.json provided in this repo and import it into Theeye
    You’ll need to set: </td>
   </tr> 
   <tr>
   <td>
         <img src="./images/imagen5.png">
         <img src="./images/imagen6.png">
   </td>
   <td>
       Github repository, which works with private and public repositories. But for this tutorial we are working on a public repository.
   </td>
   </tr> 
   <tr>
   <td>
         <img src="./images/imagen7.png">
   </td>
   <td>
     Deployment approvers, in this demo both are the same. 
     The ones who receive the notification, in this demo, again, both are the same.
     And you should configure a Webhook to continue the deployment. However In this tutorial We are not setting this.
   </td>
   </tr> 
   <tr>
   <td>
         <img src="./images/imagen8.png">
   </td>
   <td>
     Once set up, we encourage you to manually play the workflow to see what happens.
   </td>
   </tr> 
   <tr>
   <td>
         <img src="./images/imagen9.png">
   </td>
   <td>
         We can see that it finds a deviation and asks for its approval, and we are done.
   </td>
   </tr> 
   <tr>
   <td>
         <img src="./images/imagen10.png">
         <img src="./images/imagen11.png">
         <img src="./images/imagen12.png">

   </td>
   <td>
         We can start this workflow by configuring an outgoing webhook from github.
   </td>
   </tr> 
</table>

And that 's it. If you have any questions write to support@theeye.io or create a ticket in this repository

Please leave us a star at https://github.com/theeye-io-team/theeye-of-sauron.git

Thanks!


