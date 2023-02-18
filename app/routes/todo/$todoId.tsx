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