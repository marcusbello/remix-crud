## Tutorial: CRUD with RemixJs - Todo App - Prisma with postgres
In this tutorial we will learn how to build a Todo API, 
where we will talk about CRUD, using RemixJs, Docker, Prisma, Postgres, Insomnia.

### The Project - Todo API
This will be a Todo App API where the user can add a new `Todo`, 
update and also delete a `Todo`, . 
At the end of this tutorial we will have a fully functional `Todo` JSON API. 

### Tools Needed:
- npm (node)
- docker
- vscode or any other Editor of choice

### Set up Our RemixJS Project
We'll start by creating our remix project using the below command:
```
npx create-remix@latest 
```
Then, use the basic, choose typescript and run remix App server:
```
? Where would you like to create your app? remix-todo
? What type of app do you want to create? Just the basics
? Where do you want to deploy? Choose Remix App Server if you're unsure; it's easy to change deployment targets. Remix App Server
? TypeScript or JavaScript? TypeScript
? Do you want me to run `npm install`? Yes
```



### Run and Test the App
Let's test our new app by running on the terminal
```
npm run dev
```
you should see something like this
```
Remix App Server started at http://localhost:3000
```
visit `http://localhost:3000` on your browser, you'll see the
remix welcome page.

#### Basic Remix File
A basic remix file has a loader, action and the JSX element, let's see
the `$postId.tsx` file
```
import type {
  ActionArgs,
  LoaderArgs,
} from "@remix-run/node"; // or cloudflare/deno
import { useParams } from "@remix-run/react";

export const loader = async ({ params }: LoaderArgs) => {
  console.log(params.postId);
};

export const action = async ({ params }: ActionArgs) => {
  console.log(params.postId);
};

export default function PostRoute() {
  const params = useParams();
  console.log(params.postId);
}
```
Basically, we have a loader, action and the JSX element
- Loader: they autoload with the page.
- Action: Does something when there's an action
- JSX Element: handles the JSX directly


### CRUD - Create, Read, Update, Delete
CRUD is the acronym for CREATE, READ, UPDATE and DELETE.

These terms describe the four essential operations for creating and managing 
persistent data elements, mainly in relational and NoSQL databases.

A little more about CRUD:
- Create: This is adding a resource to a database or an application. 
  e.g. adding a new Todo to our Todo App.

- Read: This is reading a resource from our database or application
  e.g. getting a Todo from database

- Update: This is updating a resource from our database or application
  e.g. updating a Todo from database

- Delete: This is deleting a resource from our database or application
  e.g. deleting a Todo from database

We will do everything explained here in this tutorial.

### Add CRUD to our App using Prisma - Postgres
#### Setup prisma and Postgres

First, we will start by installing Prisma and PrismaClient that 
we will use to access the postgres database from the Remix Application.

Run the below commands from the project folder terminal:

```
npm install --save-dev prisma
npm install @prisma/client
```

Initialize our prisma with postgresql

Then, by running the below code we will initialize prisma with a postgres provider, 
so it can generate all the needed files for our application,
```
npx prisma init --datasource-provider postgresql
```
It's possible to use another database of choice, Prisma works well with 
other database like mysql, sqlite, mongo, cockroach etc. 
replace `postgresql` with any database you want to use, however, 
to continue with this tutorial, you will need to continue with postgres.


Add schema to Prisma

We'll add our Todo schema to the `prisma/schema.prisma` file,
this file was generated for us when ran the `npx prisma init` code above.
add this line to the last line

```
model Todo {
  id      Int      @id @default(autoincrement())
  title   String
  content String?
  done    Boolean  @default(false)
}
```
Push schema to postgres

To push our schema to the postgres server, we will need to
start our local postgres server using docker by downloading or copying 
[this](https://raw.githubusercontent.com/marcusbello/remix-crud/master/docker-compose.yml) 
docker-compose file to your project folder and running the below code.
```
docker-compose up
```
This will start our postgres server with the default user, password,
database set to `postgres` then we will edit `.env` file, 
make the `DATABASE_URL` equal to 
`postgresql://postgres:postgres@localhost:5432/postgres?schema=public`, 
if you edited the config in the docker file, make changes to `DATABASE_URL` too.

Run the below command to push the schema to postgres and confirm our connection:
```
npx prisma db push
```
Optional: you can check your postgres database for tables, 
Prisma have already created our table in the database, I use tablePlus.

Important: Let's Add a global database to our remix application, 
so we will not be creating new instance of Prisma client for every call.

create a file `app/utils/db.server.ts`
```
import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

declare global {
    var __db: PrismaClient | undefined;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
    db = new PrismaClient();
} else {
    if (!global.__db) {
        global.__db = new PrismaClient();
    }
    db = global.__db;
}

export { db };
```

#### Let's start the CRUD implementation

Before diving into other CRUD operations,  we'll start by using creating 
a `/todos` route, then we will give this route all the CRUD control. 
But first we will make this route return the list of all
todos in our database.

create a `app/routes/todos.tsx` and copy this code:
```
import {useLoaderData} from "@remix-run/react";
import { db } from "~/utils/db.server";

export const loader = async () => {
    return json({
        todos: await db.todo.findMany(),
    });
};

export default function TodosRoute() {
    const data = useLoaderData<typeof loader>();

    return JSON.stringify(data);
}

```

In the above code we have, I created a loader that imports `db`
from the utils, then we used PrismaClient `findMany` function to 
get the list of todo from the database. 

Then I used an exported function `TodosRoute()` to return the json result
mapped to the `/todos` route, 

check the url, you should get an empty todo list at this point.


- Let's add the CRUD functionality to our Todo App, we'll start with
Create, we will the http `POST` method to get data and 
create resource with the data, let's add this code to our `app/routes/todos.tsx`
```
export async function action({ request }: ActionArgs) {
    // read body
    const body = await request.json()
    let data: Prisma.TodoCreateInput

    if (request.method === 'POST') {
        data = {
            title: body.title,
            content: body.content,
            done: false
        }
        await db.todo.create({
            data: data,
        });
        console.log("added new todo")

        return redirect('/todos');
    }
}
```
By getting the body parsed in our request and checking the 
HTTP method used on the `/todos` url, we serialized the body and sent it to 
Prisma create, so it will add the new todo to the database


- To Create a read for this App I will use the `$` operator to handle the url 
and create a special handler for 
my todo by creating a `app/routes/todo/$todoId.tsx`.
```
import type {LoaderArgs} from "@remix-run/node";
import {json} from "@remix-run/node";
import { useLoaderData} from "@remix-run/react";
import { db } from "~/utils/db.server";


export const loader = async ({ params }: LoaderArgs) => {
    const todo = await db.todo.findUnique({
        where: { id: parseInt(params.todoId as string, 10) },
    });
    if (!todo) {
        throw new Error("Todo not found");
    }
    return json({ todo });
};

export default function TodoRoute() {
    const data = useLoaderData<typeof loader>();

    return JSON.stringify(data);
}
```
We are creating a loader that will use the `findUnique()` that takes an Id, 
then use a where Id = Id to match a record from the database, this is another
Prisma function that find one unique item that matches the conditions parsed as Args,
this function can return a not found if the item does not exist which
we have handled for our API. Using `$` in the name will make us have 
control on `/todo/$todoId` due to how routes are designed in a Remix app.
this return the todo which has the id parsed in the body as its id. 


- For Update, in this app, we are only updating the `done` field of our Todo model,
  no need to update other information, to do this we will add another 
  block of code to our action function in the `app/routes/todos.tsx`
  that uses the HTTP `PUT` method.
```
if (request.method === 'PUT') {
        const id = body.id
        const done = body.done


        await db.todo.update({
            where: {id: parseInt(id as string, 10)},
            data: {done: done},
        });

        return redirect('/todos');
    }
```
With this we are going to get the request that has a
json body consisting of id and done status, we then used Prisma
update to update the data in our database.

- Delete, to delete a resource is straightforward, it deletes resources
  from the database, let's add the code, open `app/routes/todos.tsx`, add after the
  Update code.

```
if (request.method === 'DELETE') {
        const id = body.id

        await db.todo.delete({
            where: {id: parseInt(id as string, 10)},
        });

        return redirect('/todos');
    }
```
We are using the `DELETE` http method, we will be able to delete a resource by
sending its body in the request.


Since we are done with the CRUD operations, let's restart our 
application and test with insomnia.

### Test with Insomnia
image

image

image

image


[link to test data for Insomnia](https://raw.githubusercontent.com/marcusbello/remix-crud/master/Insomnia_remix_todo_test.json)

### Conclusion
We are at the end, in this tutorial we were able to build a Todo Json API, using Remix,
Prisma and Postgres, we had two routes dedicated to our API, 
we were able to Create, Read, Update and Delete a Todo, and 
we can also see all our todos at once. 

The full code can be found on my [GitHub.com](https://github.com/marcusbello/remix-crud)