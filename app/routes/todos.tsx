import type {ActionArgs} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import type {Prisma} from '@prisma/client';
import {useLoaderData} from "@remix-run/react";
import { db } from "~/utils/db.server";


export const loader = async () => {
    return json({
        todos: await db.todo.findMany(),
    });
};

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

    if (request.method === 'PUT') {
        const id = body.id
        const done = body.done


        await db.todo.update({
            where: {id: parseInt(id as string, 10)},
            data: {done: done},
        });

        return redirect('/todos');
    }

    if (request.method === 'DELETE') {
        const id = body.id

        await db.todo.delete({
            where: {id: parseInt(id as string, 10)},
        });

        return redirect('/todos');
    }

}

export default function TodosRoute() {
    const data = useLoaderData<typeof loader>();

    return JSON.stringify(data);
}