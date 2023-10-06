import { google, drive_v3 } from "googleapis";

import prisma from "../loaders/prisma";
import { User, File, AsanaTask } from "@prisma/client";
import  axios from "axios";

const asana_base_url = process.env.ASANA_URL;






export const getToken = async (code:string)=>{
  
  const body = {
    code: code,
    grant_type: "authorization_code",
    client_id: process.env.ASANA_CLIENT_ID,
    client_secret: process.env.ASANA_CLIENT_SEC,
    redirect_uri: process.env.ASANA_REDIRECT_URL,
  };
  const config = {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  };

  try{
    const response = await axios.post(asana_base_url + 'oauth_token', body, config);

    const access_token = response.data.access_token;
    const refresh_token = response.data.refresh_token;
    const email = response.data.data.email;
    const name = response.data.data.name;
    const expire_at = BigInt(response.data.expires_in);

    


    //Check if the user exists

    let user =await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if(!user){
      user = await prisma.user.create({
        data:{
          email: email,
          name: name,
        }
      })
    }

    //check if user has Asana Auth

    let asanaAuth = await prisma.asanaAuthCredentials.findUnique({where:{userId: user.id}});
  if(!asanaAuth){
    await prisma.user.update({where: {
      id: user.id
    },data:{
      asanaAuthCredentials:{
        create:{
        accessToken: access_token,
        refreshToken: refresh_token,
        expiryDate: expire_at,
        }
      }
    }
  })
  }else{
    await prisma.user.update({where: {
      id: user.id
    },data:{
      asanaAuthCredentials:{
        update:{
        accessToken: access_token,
        refreshToken: refresh_token,
        expiryDate: expire_at,
        }
      }
    }
  })
  }


  }catch(err){
    console.log(err);

    return false;
    //throw err;
    //Check if token expired and trigger a refresh
  }
}

export const getUser = async(access_token: string) =>{
  const config = {
    headers: {
      Authorization: "Bearer " + access_token,
    },
  };

  try{
    const response = await axios.get("https://app.asana.com/api/1.0/users/me?opt_pretty=true",config);
    const {name, email} = response.data;

    return {name, email};
  }catch(err){
    return err;
  }


}

export const getTasks = async(email: string) =>{
  // const config = {
  //   headers: {
  //     Authorization: "Bearer " + access_token,
  //   },
  // };

  try{
    let user = await prisma.user.findUnique({where:{email: email}});
    let asanaAUth = await prisma.asanaAuthCredentials.findUnique({where: {userId: user.id}});

    const {workspaces} = await getUsersWorkspace(asanaAUth.accessToken, user.email);
    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
    console.log({userss: workspaces});

    for(let space of workspaces){
       await getTasksInWorkspace(asanaAUth.accessToken,space,user.email,user.id)
       console.log("done");
    }

    return true;
    

     
  }catch(err){
    return err;
  }

}

export const getUsersWorkspace = async(access_token: string, email: string) =>{
  const config = {
    headers: {
      Authorization: "Bearer " + access_token,
    },
  };

  try{
    const url = `https://app.asana.com/api/1.0/users/${email}/workspace_memberships`;
    const response = await axios.get(url,config);

    let workspaces = [];
    let assignees =[];
    
    let data = response.data.data;
    assignees.push(data[0].gid);
    
    for(let d of data){
      workspaces.push(d.workspace.gid);
    }

    console.log({workspaces})

    return {workspaces};

  }catch(err){
    return err;
  }


}

export const getTasksInWorkspace = async(access_token: string, workspace_id: string, assignee: string, userId: number) =>{
  const config = {
    headers: {
      Authorization: "Bearer " + access_token,
    },
  };

  try{
    const url = `https://app.asana.com/api/1.0/tasks?assignee=${assignee}&workspace=${workspace_id}`;
    const response = await axios.get(url,config);

    let arr = [];
    
    let data = response.data.data;

    //Store in DB

    for(let d of data){
      let s = {name: d.name, id: d.gid,resourceType: d.resource_type, workspaceId: workspace_id };

      await updateTask(s, userId);
    }

    return data.data;

  }catch(err){
    console.log(err);
    return err;
  }


}

export const updateTask = async(aTask: any, userId: number) =>{

  try{
    let task = await prisma.asanaTask.findUnique({where: {
      id: aTask.id
    }});

    if(task){
      await prisma.asanaTask.update({where: {
        id: task.id
      }, data: {
        name: aTask.name,
        workspaceId: aTask.workspaceId,
        resourceType: aTask.resourceType,
        userId: userId
        
      }
    })
    }else{
      await prisma.asanaTask.create({
        data:{
          id:aTask.id,
          name: aTask.name,
          workspaceId: aTask.workspaceId,
          resourceType: aTask.resourceType,
          userId: userId
        }
      })
    }


  }catch(err){
    return err;
  }


}

export const getStories = async(email: string) =>{
 

  try{

    let user = await prisma.user.findUnique({where:{email: email}});
    const [asanaAuth, userTasks] = await Promise.all([
      prisma.asanaAuthCredentials.findUnique({ where: { userId: user.id } }),
      prisma.asanaTask.findMany({ where: { userId: user.id } }),
    ]);

    
    const config = {
      headers: {
        Authorization: "Bearer " + asanaAuth.accessToken,
      },
    };
    for(let t  in userTasks){
      const url = `https://app.asana.com/api/1.0/tasks/${userTasks[t].id}/stories`
      const response = await axios.get(url,config);
      const data = response.data.data;

      for(let f in data){
        const d = data[f];
        if(d.type!="system"){
          //To ensure its user generated stories
          let s = {
            id:d.gid,
            text: d.text,
            createdBy: d.created_by.name,
            createdAt:d.created_at,
            type: d.type,
            taskId:userTasks[t].id
          }
  
          await updateStories(s)
        }
      
      }

    }


    



    

    return true;

  }catch(err){
    console.log(err);
    return err;
  }


}

export const updateStories = async(aStory: any) =>{

  try{
    let story = await prisma.asanaStory.findUnique({
      where: {
        id: aStory.id
      }
    })
  

    if(story){
      await prisma.asanaStory.update({where: {
        id: story.id
      }, data: {
        text: aStory.text,
        createdBy: aStory.createdBy,
        createdAt: aStory.createdAt,
        type: aStory.type,
        taskId:aStory.taskId
        
        
      }
    })
    }else{
      await prisma.asanaStory.create({
        data:{
          id:aStory.id,
          text: aStory.text,
          createdBy: aStory.createdBy,
          createdAt: aStory.createdAt,
          type: aStory.type,
          taskId:aStory.taskId
        }
      })
    }


  }catch(err){
    return err;
  }


}

