## Tutorial: CRUD with RemixJs - Todo App - Prisma with postgres


### The Project - Todo App


### Tools Needed:
- npm node
- docker
- vscode or any other Editor of choice

### Set up Our RemixJS Project
```
npx create-remix@latest 
```

### Run and Test the App
```
npm run dev
```

### CRUD - Create, Read, Update, Delete


### Add CRUD to our App using Prisma - Postgres
Install prisma
```
npm install --save-dev prisma
npm install @prisma/client
```
Initialize our prisma with postgresql
```
npx prisma init --datasource-provider postgresql
```
Add schema to Prisma

```
model Todo {
  id      Int      @id @default(autoincrement())
  title   String
  content String?
  done    Boolean  @default(false)
}
```
Push schema to postgres
```
npx prisma db push
```


### Test with Insomnia


### Conclusion
